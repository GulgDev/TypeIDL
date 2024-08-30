import type ts from "typescript";
import type { State } from "..";
import { visitNode } from "./visitNode";
import { isInternal } from "../util/isInternal";

export const visitDeleteExpression = (state: State) => (node: ts.DeleteExpression) => {
    const { tsInstance, typeChecker, idlFactory, ctx, metadata } = state;

    if (!tsInstance.isPropertyAccessExpression(node.expression))
        return tsInstance.visitEachChild(node, visitNode(state), ctx);

    const symbol = typeChecker.getSymbolAtLocation(node.expression.name);
    if (symbol && isInternal(metadata, symbol, typeChecker))
        return idlFactory.createInternalDeleteExpression(
            tsInstance.visitEachChild(node.expression.expression, visitNode(state), ctx),
            symbol
        );
    
    return tsInstance.visitEachChild(node, visitNode(state), ctx);
};