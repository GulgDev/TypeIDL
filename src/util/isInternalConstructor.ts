import type ts from "typescript";
import { makeMetadataMemoize } from "../metadata";
import { isInternal } from "./isInternal";
import { getConstructor } from "./getConstructor";

export const isInternalConstructor = makeMetadataMemoize("internalConstructor",
    (symbol: ts.Symbol, treatMissingAsInternal: boolean, tsInstance: typeof ts, typeChecker: ts.TypeChecker): boolean => {
        if (!symbol.valueDeclaration || !tsInstance.isClassDeclaration(symbol.valueDeclaration))
            return false;
        const constructor = getConstructor(symbol, tsInstance);
        return constructor ?
            isInternal(constructor, typeChecker) :
            treatMissingAsInternal;
    });