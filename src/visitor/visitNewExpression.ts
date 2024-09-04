import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { isInternalConstructor } from "../util/isInternalConstructor";
import visitEachChild from "./util/visitEachChild";

export const visitNewExpression = (state: State, visitor: Visitor): Visitor<ts.NewExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, factory, idlFactory, config, ctx } = state;

    let symbol = typeChecker.getSymbolAtLocation(node.expression);
    if (!symbol)
        return visitEachChild(tsInstance, node, visitor, ctx);
    symbol = tsInstance.getSymbolTarget(symbol, typeChecker);
    
    if (isInternalConstructor(symbol, config.treatMissingConstructorAsInternal, tsInstance, typeChecker)) {
        const newExpr = visitEachChild(tsInstance, node, visitor, ctx);
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

    return visitEachChild(tsInstance, node, visitor, ctx);
};