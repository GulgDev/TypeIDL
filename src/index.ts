import type ts from "typescript";
import type { TransformerExtras, PluginConfig } from "ts-patch";
import { makeMetadataManager, type MetadataManager } from "./metadata";
import { resolve, relative, dirname } from "path";
import { type IDLFactory, makeFactory } from "./factory";
import { type TypeUtils, makeTypeUtils } from "./typeUtils";
import makeVisitor from "./visitor";
import visitNode from "./visitor/util/visitNode";

export interface IDLConfig {
    treatMissingConstructorAsInternal: boolean;
    useIDLDecorator: boolean;
    trustGlobals: boolean;
}

export interface State {
    tsInstance: typeof ts;
    typeChecker: ts.TypeChecker;
    typeUtils: TypeUtils;
    factory: ts.NodeFactory;
    idlFactory: IDLFactory;
    config: IDLConfig;
    ctx: ts.TransformationContext;
    metadata: MetadataManager;

    initializers: ts.Statement[];
    
    addInternal(symbol: ts.Symbol): void;
    addMark(symbol: ts.Symbol): void;

    typeConverters: WeakMap<ts.Type, ts.Expression>;
}

// @TODO: Add checks for `trustGlobals` flag to visitIdentifier, visitCallExpression, visitPropertyAccessExpression and visitBinaryExpression
// @TODO: Fix bug with accessing static props

const INTERNALS_INIT = `
function get(o, p) {
    return p.get(o);
}

function set(o, p, v) {
    p.set(o, v);
    return v;
}

function delete_(o, p) {
    return p.delete(o);
}

function call(o, p, args) {
    return get(o, p).apply(o, args);
}

function mark(o, p) {
    p.add(o);
}

function has(o, p) {
    return p.has(o);
}

function getMisc(k) {
    return misc.get(k);
}

function setMisc(k, v) {
    misc.set(k, v);
}

const misc = new Map();
`.trimStart();

const INTERNALS_UNTRUSTED_GLOBALS_INIT = `
function get(o, p) {
    return apply(weakMapGet, p, [o]);
}

function set(o, p, v) {
    apply(weakMapSet, p, [o, v]);
    return v;
}

function delete_(o, p) {
    return apply(weakMapDelete, p, [o]);
}

function call(o, p, args) {
    return apply(get(o, p), o, args);
}

function mark(o, p) {
    apply(setAdd, p, [o]);
}

function has(o, p) {
    return apply(setHas, p, [o]);
}

function getMisc(k) {
    return apply(mapGet, misc, [k]);
}

function setMisc(k, v) {
    apply(mapSet, misc, [k, v]);
}

const apply = Function.prototype.call.bind(Function.prototype.apply);

const { get: weakMapGet, set: weakMapSet, delete: weakMapDelete } = WeakMap.prototype;
const { get: mapGet, set: mapSet } = Map.prototype;
const { add: setAdd, has: setHas } = Set.prototype;

const misc = new Map();
`.trimStart();

export function idl<T extends Function>(func: T): T {
    return func;
}

export default function (program: ts.Program, pluginConfig: PluginConfig, { ts: tsInstance }: TransformerExtras) {
    const typeChecker = program.getTypeChecker();
    const compilerOptions = program.getCompilerOptions();

    const typeUtils = makeTypeUtils(tsInstance, typeChecker);
    const metadata = makeMetadataManager(typeChecker);

    const config: IDLConfig = {
        treatMissingConstructorAsInternal: !!(pluginConfig.treatMissingConstructorAsInternal ?? true),
        useIDLDecorator: !!(pluginConfig.useIDLDecorator ?? false),
        trustGlobals: !!(pluginConfig.trustGlobals ?? true)
    };

    let internalsContent = config.trustGlobals ? INTERNALS_INIT : INTERNALS_UNTRUSTED_GLOBALS_INIT;

    const internalsFile = resolve(compilerOptions.outDir ?? ".", "__typeidl.js");

    const internalsExports = ["get", "set", "delete_", "call", "mark", "has", "getMisc", "setMisc"];
    if (!config.trustGlobals)
        internalsExports.push("apply");
    
    const exportsPrefix = compilerOptions.module === tsInstance.ModuleKind.CommonJS ?
        "module.exports =" :
        "export";
    
    tsInstance.sys.writeFile(internalsFile, internalsContent + makeInternalExports());

    function makeInternalExports() {
        return `\n${exportsPrefix} { ${internalsExports.join(", ")} };\n`;
    }

    function appendInternal(name: string, value: string) {
        internalsExports.push(name);
        tsInstance.sys.writeFile(internalsFile, (internalsContent += `const ${name} = ${value}\n`) + makeInternalExports());
    }

    return (ctx: ts.TransformationContext) => {
        const { factory } = ctx;

        const internalsName = factory.createUniqueName("internals");
        
        return (sourceFile: ts.SourceFile) => {
            const internalsRelative = relative(
                dirname(
                    tsInstance.getSourceFilePathInNewDir(
                        sourceFile.fileName, ctx.getEmitHost(), compilerOptions.outDir ?? "."
                    )
                ),
                internalsFile
            ).replace(/\\/g, "/").replace(/^(?=[^.])/, "./").replace(/\.js$/, "");

            const references: Map<ts.Identifier, { [key: string]: ts.Identifier }> = new Map();

            const initializers: ts.Statement[] = [];

            const state: State = {
                tsInstance,
                typeChecker,
                typeUtils,
                factory,
                idlFactory: makeFactory(
                    internalsName,
                    initializers,
                    references,
                    new Map(),
                    new Map(),
                    {},
                    tsInstance,
                    typeChecker,
                    factory,
                    metadata,
                    config.trustGlobals
                ),
                config,
                ctx,
                metadata,
    
                initializers,
    
                addInternal(symbol: ts.Symbol) {
                    appendInternal("internal" + metadata.getSymbolId(symbol), "new WeakMap();");
                },
                addMark(symbol: ts.Symbol) {
                    appendInternal("internal" + metadata.getSymbolId(symbol), "new WeakSet();");
                },
    
                typeConverters: new WeakMap()
            };

            references.set(state.idlFactory.createIdentifier("globalThis"), {});

            sourceFile = visitNode(tsInstance, sourceFile, makeVisitor(state)) as ts.SourceFile;

            return factory.updateSourceFile(
                sourceFile,
                [
                    compilerOptions.module === tsInstance.ModuleKind.CommonJS ?
                        factory.createVariableStatement(
                            undefined,
                            factory.createVariableDeclarationList([
                                factory.createVariableDeclaration(
                                    internalsName,
                                    undefined,
                                    undefined,
                                    factory.createCallExpression(
                                        factory.createIdentifier("require"),
                                        undefined,
                                        [factory.createStringLiteral(internalsRelative)]
                                    )
                                )
                            ], tsInstance.NodeFlags.Const)
                        ) :
                        factory.createImportDeclaration(
                            undefined,
                            factory.createImportClause(
                                false,
                                undefined,
                                factory.createNamespaceImport(internalsName)
                            ),
                            factory.createStringLiteral(internalsRelative)
                        ),
                    factory.createVariableStatement(
                        undefined,
                        factory.createVariableDeclarationList(
                            Array.from(references.entries()).map(([name, propertyReferences]) =>
                                factory.createVariableDeclaration(
                                    factory.createObjectBindingPattern(
                                        Object.entries(propertyReferences).map(([propertyName, localName]) =>
                                            factory.createBindingElement(undefined, propertyName, localName)
                                        )
                                    ),
                                    undefined,
                                    undefined,
                                    name
                                )
                            ),
                            tsInstance.NodeFlags.Let
                        )
                    ),
                    ...state.initializers,
                    ...sourceFile.statements
                ],
                sourceFile.isDeclarationFile,
                sourceFile.referencedFiles,
                sourceFile.typeReferenceDirectives,
                sourceFile.hasNoDefaultLib,
                sourceFile.libReferenceDirectives
            );
        };
    };
}