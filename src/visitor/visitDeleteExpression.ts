import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { createMirror } from "../util/createMirror";
import { hasIDL } from "../util/hasIDL";
import { isInternal } from "../util/isInternal";
import visitEachChild from "./util/visitEachChild";

export const visitDeleteExpression = (state: State, visitor: Visitor): Visitor<ts.DeleteExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, typeUtils, factory, idlFactory, config, ctx } = state;

    if (!tsInstance.isPropertyAccessExpression(node.expression))
        return visitEachChild(tsInstance, node, visitor, ctx);

    let symbol = typeChecker.getSymbolAtLocation(node.expression.name);
    if (!symbol)
        return visitEachChild(tsInstance, node, visitor, ctx);
    symbol = tsInstance.getSymbolTarget(symbol, typeChecker);

    if (isInternal(symbol, typeChecker))
        return idlFactory.createInternalDeleteExpression(
            visitEachChild(tsInstance, node.expression.expression, visitor, ctx),
            symbol
        );
    
    const parent = typeChecker.getSymbolAtLocation(node.expression.expression);
    if (parent && hasIDL(parent, config.useIDLDecorator, tsInstance, typeUtils))
        return factory.createLogicalAnd(
            node,
            idlFactory.createInternalDeleteExpression(
                visitEachChild(tsInstance, node.expression.expression, visitor, ctx),
                createMirror(symbol, typeChecker)
            )
        );
    
    return visitEachChild(tsInstance, node, visitor, ctx);
};