/// <reference lib="es2021" />

import type ts from "typescript";
import type { IDLConfig } from "../src/index";
import { dirname, resolve, sep } from "path";
import { join } from "path/posix";
import { getTsPackage } from "ts-patch/ts-package.js";
import { getPatchedSource } from "ts-patch/patch/get-patched-source.js";
import { getTsModule } from "ts-patch/module/ts-module.js";
import { rollup } from "rollup";
import requireFromString from "require-from-string";

declare global {
    var moduleGlobals: Record<string, any> | undefined;
}

interface CompileOutput {
    code?: string;
    diagnostics: readonly ts.Diagnostic[];
}

const tsPackage = getTsPackage();
const tsModule = getTsModule(tsPackage, "typescript.js");
const tspSource = getPatchedSource(tsModule);
const tsp: typeof ts = requireFromString(tspSource.js);

const root = process.platform === "win32" ? "V:/" : "/virtual/";

const typeidlModule = `
export const idl = <T extends Function>(func: T): T => func;
`;

function createCompilerHost(): ts.CompilerHost {
    const files: Record<string, string> = {};

    return {
        getSourceFile: tsp.createGetSourceFile(readFile, undefined),
        getDefaultLibFileName: (options) => resolve("./node_modules/typescript/lib", tsp.getDefaultLibFileName(options)),
        readFile,
        writeFile,
        fileExists,
        getCurrentDirectory: () => root,
        getCanonicalFileName: (fileName) => fileName.replace(sep, "/"),
        useCaseSensitiveFileNames: () => tsp.sys.useCaseSensitiveFileNames,
        getNewLine: () => tsp.sys.newLine
    };

    function readFile(fileName: string) {
        return fileName.startsWith(root) ?
            files[fileName] :
            tsp.sys.readFile(fileName);
    }

    function writeFile(fileName: string, text: string, writeByteOrderMark: boolean) {
        return fileName.startsWith(root) ?
            files[fileName] = text :
            tsp.sys.writeFile(fileName, text, writeByteOrderMark);
    }

    function fileExists(fileName: string) {
        return fileName.startsWith(root) ?
            fileName in files :
            tsp.sys.fileExists(fileName);
    }
}

function getCaller() {
    const original = Error.prepareStackTrace;
    Error.prepareStackTrace = (_error, callsites) => void (stackFrames = callsites);
    
    let stackFrames: NodeJS.CallSite[] | undefined = undefined;

    new Error().stack;

    const caller = stackFrames![2];

    Error.prepareStackTrace = original;

    return caller;
}

export async function compile(code: string, config: Partial<IDLConfig> = {}, caller: NodeJS.CallSite = getCaller()): Promise<CompileOutput> {
    const host = createCompilerHost();
    host.writeFile(join(root, "index.ts").replaceAll(sep, "/"), code, false);
    host.writeFile(join(root, "typeidl.ts").replaceAll(sep, "/"), typeidlModule, false);

    const program = tsp.createProgram([join(root, "index.ts")], {
        rootDir: root,
        outDir: root,
        baseUrl: root,
        module: tsp.ModuleKind.ES2022,
        target: tsp.ScriptTarget.ES2022,
        strictNullChecks: true,
        sourceMap: true,
        noEmitOnError: true,
        experimentalDecorators: true,
        plugins: [{ transform: resolve(__dirname, "../src"), ...config } as any]
    }, host);
    let { diagnostics, sourceMaps, emitSkipped } = program.emit();
    diagnostics = tsp.getPreEmitDiagnostics(program).concat(diagnostics);
    
    let outputCode: string | undefined;
    if (!emitSkipped) {
        const bundle = await rollup({
            onLog: () => void 0,
            input: join(root, "index.js"),
            plugins: [
                {
                    name: "typeidl-resolve",
                    load(id) {
                        return host.readFile(id.replaceAll(sep, "/"));
                    },
                    resolveId(source, importer) {
                        if (!importer)
                            return resolve(root, source);

                        let resolved = resolve(root, dirname(importer), source).replaceAll(sep, "/");
                        if (host.fileExists(resolved))
                            return resolved;

                        resolved += ".js";
                        if (host.fileExists(resolved))
                            return resolved;

                        throw new Error(`Could not resolve '${source}' from '${importer}'.`);
                    }
                }
            ]
        });
    
        const rollupOutput = await bundle.generate({
            format: "commonjs",
            sourcemap: "hidden"
        });

        outputCode = rollupOutput.output[0].code;
    }

    return { code: outputCode, diagnostics };
}

export async function compileAndLoad(code: string, globals: Record<string, any> = {}, config?: Partial<IDLConfig>): Promise<any> {
    const caller = getCaller();

    const output = await compile(
        Object.keys(globals)
            .map((global) => `declare var ${global}: any;`)
            .join(tsp.sys.newLine) + tsp.sys.newLine + code,
        config,
        caller);
    if (!output.code)
        throw new Error("TypeScript failed with the following errors:\n" + tsp.formatDiagnostics(output.diagnostics, {
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => root,
            getNewLine: () => tsp.sys.newLine
        }));
    
    const exports = {};
    eval(
        "var { " +
        Object.keys(globals)
            .join(", ") + " } = globals;\n\n{\n" + output.code + "\n}"
    );
    return exports;
}