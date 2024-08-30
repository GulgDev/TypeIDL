import type ts from "typescript";

export interface TypeUtils {
    getSymbol(expression: ts.Expression): ts.Symbol;
    getDeclaredFileName(symbol: ts.Symbol): string;
}

export const makeTypeUtils = (tsInstance: typeof ts, typeChecker: ts.TypeChecker): TypeUtils => (
    {
        getSymbol(expression) {
            let symbol = typeChecker.getSymbolAtLocation(expression)!;
            while (symbol.flags & tsInstance.SymbolFlags.Alias)
                symbol = typeChecker.getAliasedSymbol(symbol);
            return symbol;
        },
        getDeclaredFileName(symbol) {
            let moduleSymbol: ts.Symbol | undefined = symbol;
            while (moduleSymbol && !(moduleSymbol.flags & tsInstance.SymbolFlags.Module))
                moduleSymbol = moduleSymbol.parent;
            return (moduleSymbol?.declarations?.[0] as ts.SourceFile)?.fileName ?? "";
        }
    }
);