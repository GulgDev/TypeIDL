import type ts from "typescript";
import { type MetadataManager, makeMetadataMemoize } from "../metadata";
import { isInternal } from "./isInternal";
import { getConstructor } from "./getConstructor";

export const isInternalConstructor = makeMetadataMemoize("internalConstructor",
    (metadata: MetadataManager, symbol: ts.Symbol, treatMissingAsInternal: boolean, tsInstance: typeof ts, typeChecker: ts.TypeChecker): boolean => {
        const constructor = getConstructor(metadata, symbol, tsInstance);
        return constructor ?
            isInternal(metadata, constructor, typeChecker) :
            treatMissingAsInternal;
    });