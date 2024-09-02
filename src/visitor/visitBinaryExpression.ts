import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { isInternal } from "../util/isInternal";
import { isGlobal } from "../util/isGlobal";
import visitNode from "./util/visitNode";
import visitEachChild from "./util/visitEachChild";

export const visitBinaryExpression = (state: State, visitor: Visitor): Visitor<ts.BinaryExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, factory, idlFactory, config, ctx, metadata } = state;

    if (node.operatorToken.kind !== tsInstance.SyntaxKind.EqualsToken ||
        !tsInstance.isPropertyAccessExpression(node.left))
        return visitEachChild(tsInstance, node, visitor, ctx);
    
    const symbol = typeChecker.getSymbolAtLocation(node.left.name);
    if (!symbol)
        return visitEachChild(tsInstance, node, visitor, ctx);

    if (isInternal(metadata, symbol, typeChecker))
        return idlFactory.createInternalSetExpression(
            visitEachChild(tsInstance, node.left.expression, visitor, ctx),
            symbol,
            visitEachChild(tsInstance, node.right, visitor, ctx)
        );
    
    if (config.trustGlobals)
        return node;    

    const parent = typeChecker.getSymbolAtLocation(node.left.expression);
    
    node = factory.updateBinaryExpression(
        node,
        visitEachChild(tsInstance, node.left, visitor, ctx),
        node.operatorToken,
        visitNode(tsInstance, node.right, visitor) as ts.Expression
    );
    if (!tsInstance.isPropertyAccessExpression(node.left))
        throw new TypeError("Expected property access expression");

    if (parent && (metadata.getSymbolMetadata(symbol).intrinsic = metadata.getSymbolMetadata(parent).intrinsic))
        return factory.updateBinaryExpression(
            node,
            idlFactory.createPropertyReference(node.left.expression, symbol.name),
            node.operatorToken,
            node.right
        );

    const type = typeChecker.getTypeAtLocation(node.left.expression);
    if (type.symbol && isGlobal(metadata, type.symbol, tsInstance, typeChecker))
        return idlFactory.createFunctionApplyCall(
            idlFactory.createInstancePropertyAccessorsReference(
                idlFactory.createGlobalReference(type.symbol.name),
                symbol.name
            )[1],
            visitNode(tsInstance, node.left.expression, visitor) as ts.Expression,
            factory.createArrayLiteralExpression([
                visitNode(tsInstance, node.right, visitor) as ts.Expression
            ])
        );
    
    return visitEachChild(tsInstance, node, visitor, ctx);
};