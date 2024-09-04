import type ts from "typescript";
import type { State } from "..";
import { getSymbolMetadata } from "../metadata";
import { isGlobal } from "../util/isGlobal";
import { type Visitor, VisitHint } from "./util";

export const visitIdentifier = (state: State): Visitor<ts.Identifier> => (hint, node) => {
    const { tsInstance, typeChecker, idlFactory, config } = state;

    if (config.trustGlobals)
        return node;

    if (hint !== VisitHint.Expression)
        return node;

    const symbol = typeChecker.getSymbolAtLocation(node);
    if (!symbol)
        return node;

    if (!(getSymbolMetadata(symbol).fresh = symbol.name === "globalThis") &&
         (getSymbolMetadata(symbol).intrinsic = isGlobal(symbol, tsInstance, typeChecker)))
        return idlFactory.createGlobalReference(node.text);
    
    return node;
};