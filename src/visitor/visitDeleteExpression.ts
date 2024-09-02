import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { isInternal } from "../util/isInternal";
import visitEachChild from "./util/visitEachChild";

export const visitDeleteExpression = (state: State, visitor: Visitor): Visitor<ts.DeleteExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, idlFactory, ctx, metadata } = state;

    if (!tsInstance.isPropertyAccessExpression(node.expression))
        return visitEachChild(tsInstance, node, visitor, ctx);

    const symbol = typeChecker.getSymbolAtLocation(node.expression.name);
    if (symbol && isInternal(metadata, symbol, typeChecker))
        return idlFactory.createInternalDeleteExpression(
            visitEachChild(tsInstance, node.expression.expression, visitor, ctx),
            symbol
        );
    
    return visitEachChild(tsInstance, node, visitor, ctx);
};