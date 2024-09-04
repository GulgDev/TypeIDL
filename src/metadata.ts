import type ts from "typescript";

interface SymbolWithMetadata extends ts.Symbol {
    metadata?: { [key: string]: any };
}

export function getSymbolMetadata(symbol: ts.Symbol) {
    const withMetadata = symbol as SymbolWithMetadata;
    return withMetadata.metadata ?? (withMetadata.metadata = {});
};

export const makeMetadataMemoize =
    <A extends any[], T>(
        key: string,
        callback: (symbol: ts.Symbol, ...args: A) => T
    ): (symbol: ts.Symbol, ...args: A) => T =>
        (symbol, ...args) => {
            const metadata = getSymbolMetadata(symbol);
            return key in metadata ?
                metadata[key] :
                metadata[key] = callback(symbol, ...args);
        };