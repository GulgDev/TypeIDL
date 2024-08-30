import type ts from "typescript";
import type { TransformerExtras, PluginConfig } from "ts-patch";
import { makeMetadataManager, type MetadataManager } from "./metadata";
import { resolve, relative, dirname } from "path";
import { type IDLFactory, makeFactory } from "./factory";
import { type TypeUtils, makeTypeUtils } from "./typeUtils";
import { visitNode } from "./visitors/visitNode";

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

    addInternal(symbol: ts.Symbol): void;
    addMark(symbol: ts.Symbol): void;

    typeConverters: WeakMap<ts.Type, ts.Expression>;
    converters: ts.Statement[];
}

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

    let internalsContent = INTERNALS_INIT;

    const internalsFile = resolve(compilerOptions.outDir ?? ".", "__typeidl.js");

    const internalsExports = ["get", "set", "delete_", "call", "mark", "has", "misc"];
    
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
        
        return (sourceFile: ts.SourceFile) => {
            const internalsName = factory.createUniqueName("internals");

            const internalsRelative = relative(
                dirname(
                    tsInstance.getSourceFilePathInNewDir(
                        sourceFile.fileName, ctx.getEmitHost(), compilerOptions.outDir ?? "."
                    )
                ),
                internalsFile
            ).replace(/\\/g, "/").replace(/^(?=[^.])/, "./").replace(/\.js$/, "");

            const state: State = {
                tsInstance,
                typeChecker,
                typeUtils,
                factory,
                idlFactory: makeFactory(internalsName, factory, metadata),
                config,
                ctx,
                metadata,

                addInternal(symbol: ts.Symbol) {
                    appendInternal("internal" + metadata.getSymbolId(symbol), "new WeakMap();");
                },
                addMark(symbol: ts.Symbol) {
                    appendInternal("internal" + metadata.getSymbolId(symbol), "new WeakSet();");
                },

                typeConverters: new WeakMap(),
                converters: []
            };

            sourceFile = tsInstance.visitNode(sourceFile, visitNode(state)) as ts.SourceFile;

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
                    ...state.converters,
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