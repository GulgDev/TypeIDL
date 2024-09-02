import type ts from "typescript";
import { type MetadataManager, makeMetadataMemoize } from "../metadata";

export const getConstructor = makeMetadataMemoize("classConstructor",
    (_metadata: MetadataManager, symbol: ts.Symbol, tsInstance: typeof ts): ts.Symbol | undefined => {
        if (!symbol.declarations)
            return;
        for (const declaration of symbol.declarations)
            if (tsInstance.isClassDeclaration(declaration))
                for (const member of declaration.members)
                    if (tsInstance.isConstructorDeclaration(member))
                        return member.symbol;
    });