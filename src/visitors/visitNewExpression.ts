import type ts from "typescript";
import type { State } from "..";
import { visitNode } from "./visitNode";
import { isInternalConstructor } from "../util/isInternalConstructor";

export const visitNewExpression = (state: State) => (node: ts.NewExpression) => {
    const { tsInstance, typeChecker, factory, idlFactory, config, ctx, metadata } = state;

    const symbol = typeChecker.getSymbolAtLocation(node.expression);
    if (symbol && isInternalConstructor(metadata, symbol, config.treatMissingConstructorAsInternal, tsInstance, typeChecker)) {
        const newExpr = tsInstance.visitEachChild(node, visitNode(state), ctx) as ts.NewExpression;
        return factory.updateNewExpression(
            newExpr,
            newExpr.expression,
            newExpr.typeArguments,
            [
                idlFactory.createInternalGetMiscExpression(symbol),
                ...newExpr.arguments ?? []
            ]
        );
    }

    return tsInstance.visitEachChild(node, visitNode(state), ctx);
};