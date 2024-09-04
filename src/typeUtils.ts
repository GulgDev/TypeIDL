import type ts from "typescript";

export interface TypeUtils {
    getSymbol(expression: ts.Expression): ts.Symbol | undefined;
    getDeclaredFileName(symbol: ts.Symbol): string;
}

export const makeTypeUtils = (tsInstance: typeof ts, typeChecker: ts.TypeChecker): TypeUtils => (
    {
        getSymbol(expression) {
            let symbol = typeChecker.getSymbolAtLocation(expression)!;
            if (symbol)
                return tsInstance.getSymbolTarget(symbol, typeChecker);
        },
        getDeclaredFileName(symbol) {
            let moduleSymbol: ts.Symbol | undefined = symbol;
            while (moduleSymbol && !(moduleSymbol.flags & tsInstance.SymbolFlags.Module))
                moduleSymbol = moduleSymbol.parent;
            return (moduleSymbol?.valueDeclaration as ts.SourceFile)?.fileName ?? "";
        }
    }
);