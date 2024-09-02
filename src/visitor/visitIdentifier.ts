import type ts from "typescript";
import type { State } from "..";
import { isGlobal } from "../util/isGlobal";
import { type Visitor, VisitHint } from "./util";

export const visitIdentifier = (state: State): Visitor<ts.Identifier> => (hint, node) => {
    const { tsInstance, typeChecker, idlFactory, config, metadata } = state;

    if (config.trustGlobals)
        return node;

    if (hint !== VisitHint.Expression)
        return node;

    const symbol = typeChecker.getSymbolAtLocation(node);
    if (!symbol)
        return node;

    if (metadata.getSymbolMetadata(symbol).intrinsic = symbol.name !== "globalThis" && isGlobal(metadata, symbol, tsInstance, typeChecker))
        return idlFactory.createGlobalReference(node.text);
    
    return node;
};