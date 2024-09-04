import type ts from "typescript";
import { makeMetadataMemoize } from "../metadata";

export const isGlobal = makeMetadataMemoize("global",
    (symbol: ts.Symbol, tsInstance: typeof ts, typeChecker: ts.TypeChecker): boolean =>
        symbol.valueDeclaration !== undefined &&
        (
            !tsInstance.isFunctionDeclaration(symbol.valueDeclaration) ||
            (tsInstance.modifiersToFlags(
                symbol.valueDeclaration.modifiers
            ) & tsInstance.ModifierFlags.Ambient) !== 0
        ) &&
        typeChecker.getTypeOfSymbol(
            typeChecker.resolveName("globalThis", undefined, tsInstance.SymbolFlags.NamespaceModule, false)!
        ).getProperty(symbol.name) === symbol);