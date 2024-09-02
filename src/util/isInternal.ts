import type ts from "typescript";
import { type MetadataManager, makeMetadataMemoize } from "../metadata";

export const isInternal = makeMetadataMemoize("internal",
    (_metadata: MetadataManager, symbol: ts.Symbol, typeChecker: ts.TypeChecker): boolean =>
        symbol.getJsDocTags(typeChecker)
            .find((tag) => tag.name === "internal") !== undefined);