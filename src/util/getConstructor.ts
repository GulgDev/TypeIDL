import type ts from "typescript";
import { makeMetadataMemoize } from "../metadata";

export const getConstructor = makeMetadataMemoize("classConstructor",
    (symbol: ts.Symbol, tsInstance: typeof ts): ts.Symbol | undefined => {
        if (!symbol.valueDeclaration)
            return;
        if (tsInstance.isClassDeclaration(symbol.valueDeclaration))
            for (const member of symbol.valueDeclaration.members)
                if (tsInstance.isConstructorDeclaration(member))
                    return member.symbol;
    });