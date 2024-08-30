import type ts from "typescript";
import type { State } from "..";
import { visitNode } from "./visitNode";
import { isInternal } from "../util/isInternal";

export const visitBinaryExpression = (state: State) => (node: ts.BinaryExpression) => {
    const { tsInstance, typeChecker, ctx, metadata, idlFactory } = state;

    if (node.operatorToken.kind !== tsInstance.SyntaxKind.EqualsToken ||
        !tsInstance.isPropertyAccessExpression(node.left))
        return tsInstance.visitEachChild(node, visitNode(state), ctx);
    
    const symbol = typeChecker.getSymbolAtLocation(node.left.name);
    if (symbol && isInternal(metadata, symbol, typeChecker))
        return idlFactory.createInternalSetExpression(
            tsInstance.visitEachChild(node.left.expression, visitNode(state), ctx),
            symbol,
            tsInstance.visitEachChild(node.right, visitNode(state), ctx)
        );
    
    return tsInstance.visitEachChild(node, visitNode(state), ctx);
};