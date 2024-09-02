import type ts from "typescript";
import { type MetadataManager, makeMetadataMemoize } from "../metadata";

export const isGlobal = makeMetadataMemoize("global",
    (_metadata: MetadataManager, symbol: ts.Symbol, tsInstance: typeof ts, typeChecker: ts.TypeChecker): boolean =>
        typeChecker.getTypeOfSymbol(
            typeChecker.resolveName("globalThis", undefined, tsInstance.SymbolFlags.NamespaceModule, false)!
        ).getProperty(symbol.name) === symbol);