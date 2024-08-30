import type ts from "typescript";
import type { State } from "..";
import { visitNode } from "./visitNode";
import { isInternal } from "../util/isInternal";

export const visitPropertyAccessExpression = (state: State) => (node: ts.PropertyAccessExpression) => {
    const { tsInstance, typeChecker, idlFactory, ctx, metadata } = state;

    const symbol = typeChecker.getSymbolAtLocation(node.name);
    if (symbol && isInternal(metadata, symbol, typeChecker))
        return idlFactory.createInternalGetExpression(
            tsInstance.visitNode(node.expression, visitNode(state)) as ts.Expression,
            symbol
        );
    
    return tsInstance.visitEachChild(node, visitNode(state), ctx);
};