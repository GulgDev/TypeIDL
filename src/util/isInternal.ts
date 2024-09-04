import type ts from "typescript";
import { makeMetadataMemoize } from "../metadata";

export const isInternal = makeMetadataMemoize("internal",
    (symbol: ts.Symbol, typeChecker: ts.TypeChecker): boolean =>
        symbol.getJsDocTags(typeChecker)
            .find((tag) => tag.name === "internal") !== undefined);