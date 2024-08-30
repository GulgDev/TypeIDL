import type ts from "typescript";
import { makeMetadataMemoize } from "../metadata";

export const isInternalConstructor = makeMetadataMemoize("internalConstructor",
    (symbol: ts.Symbol, treatMissingAsInternal: boolean, tsInstance: typeof ts, typeChecker: ts.TypeChecker): boolean => {
        if (!symbol.declarations)
            return false;
        for (const declaration of symbol.declarations)
            if (tsInstance.isClassDeclaration(declaration)) {
                let hasInternalConstructor = treatMissingAsInternal;
                for (const member of declaration.members)
                    if (tsInstance.isConstructorDeclaration(member)) {
                        hasInternalConstructor = ((member.original as ts.ConstructorDeclaration ?? member).symbol as ts.Symbol)
                                                    .getJsDocTags(typeChecker) // TODO
                                                    .find((tag) => tag.name === "internal") !== undefined;
                        break;
                    }
                return hasInternalConstructor;
            }
        return treatMissingAsInternal;
    });