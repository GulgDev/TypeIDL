import type ts from "typescript";
import type { TypeUtils } from "../typeUtils";
import { resolve, sep } from "path";
import { makeMetadataMemoize } from "../metadata";

export const hasIDL = makeMetadataMemoize("idl",
    (symbol: ts.Symbol, useDecorator: boolean, tsInstance: typeof ts, typeUtils: TypeUtils): boolean => {
        if (!(symbol.valueDeclaration && tsInstance.isClassDeclaration(symbol.valueDeclaration)))
            return false;
        if (!useDecorator)
            return true;
        const decorators = tsInstance.getDecorators(symbol.valueDeclaration);
        return !!(decorators && decorators.find((decorator) => {
            const symbol = typeUtils.getSymbol(decorator.expression);
            return symbol && symbol.name === "idl" &&
                    typeUtils.getDeclaredFileName(symbol) === resolve(__dirname, "../index.d.ts").replaceAll(sep, "/");
        }));
    });