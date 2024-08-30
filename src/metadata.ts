import type ts from "typescript";

export interface MetadataManager {
    getSymbolId(symbol: ts.Symbol): number;
    getSymbolMetadata(symbol: ts.Symbol): { [key: string]: any };
}

export const makeMetadataManager = (typeChecker: ts.TypeChecker): MetadataManager => {
    const symbols: string[] = [];
    const metadata: Map<string, { [key: string]: any }> = new Map();

    function getSymbolId(symbol: ts.Symbol) {
        const name = typeChecker.getFullyQualifiedName(symbol);
        return symbols.indexOf(name) + 1 || symbols.push(name);
    }
    
    function getSymbolMetadata(symbol: ts.Symbol) {
        const name = typeChecker.getFullyQualifiedName(symbol);
        let symbolMetadata = metadata.get(name);
        if (!symbolMetadata) {
            symbolMetadata = {};
            metadata.set(name, symbolMetadata);
        }
        return symbolMetadata;
    }

    return {
        getSymbolId,
        getSymbolMetadata
    };
};

export const makeMetadataMemoize =
    <A extends any[], T>(
        key: string,
        callback: (symbol: ts.Symbol, ...args: A) => T
    ): (metadata: MetadataManager, symbol: ts.Symbol, ...args: A) => T =>
        (metadata: MetadataManager, symbol: ts.Symbol, ...args: A) => {
            const symbolMetadata = metadata.getSymbolMetadata(symbol);
            return key in symbolMetadata ?
                symbolMetadata[key] :
                symbolMetadata[key] = callback(symbol, ...args);
        };