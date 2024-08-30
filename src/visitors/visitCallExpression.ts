import type ts from "typescript";
import type { State } from "..";
import { visitNode } from "./visitNode";
import { isInternal } from "../util/isInternal";

export const visitCallExpression = (state: State) => (node: ts.CallExpression) => {
    const { tsInstance, typeChecker, idlFactory, ctx, metadata } = state;

    if (!tsInstance.isPropertyAccessExpression(node.expression))
        return tsInstance.visitEachChild(node, visitNode(state), ctx);

    const symbol = typeChecker.getSymbolAtLocation(node.expression.name);
    if (symbol && isInternal(metadata, symbol, typeChecker))
        return idlFactory.createInternalCallExpression(
            tsInstance.visitNode(node.expression.expression, visitNode(state)) as ts.Expression,
            symbol,
            tsInstance.visitNodes(node.arguments, visitNode(state)) as ts.NodeArray<ts.Expression>
        );
    
    return tsInstance.visitEachChild(node, visitNode(state), ctx);
};