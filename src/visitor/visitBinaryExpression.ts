import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { getSymbolMetadata } from "../metadata";
import { createMirror } from "../util/createMirror";
import { hasIDL } from "../util/hasIDL";
import { isInternal } from "../util/isInternal";
import { isGlobal } from "../util/isGlobal";
import visitNode from "./util/visitNode";
import visitEachChild from "./util/visitEachChild";

export const visitBinaryExpression = (state: State, visitor: Visitor): Visitor<ts.BinaryExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, typeUtils, factory, idlFactory, config, ctx } = state;

    if (node.operatorToken.kind !== tsInstance.SyntaxKind.EqualsToken ||
        !tsInstance.isPropertyAccessExpression(node.left))
        return visitEachChild(tsInstance, node, visitor, ctx);
    
        let symbol = typeChecker.getSymbolAtLocation(node.left.name);
        if (!symbol)
            return visitEachChild(tsInstance, node, visitor, ctx);
        symbol = tsInstance.getSymbolTarget(symbol, typeChecker);

    if (isInternal(symbol, typeChecker))
        return idlFactory.createInternalSetExpression(
            visitEachChild(tsInstance, node.left.expression, visitor, ctx),
            symbol,
            visitNode(tsInstance, node.right, visitor) as ts.Expression
        );
    
    const parent = typeChecker.getSymbolAtLocation(node.left.expression);
    
    if (parent && hasIDL(parent, config.useIDLDecorator, tsInstance, typeUtils))
        return idlFactory.createInternalSetExpression(
            visitEachChild(tsInstance, node.left.expression, visitor, ctx),
            createMirror(symbol, typeChecker),
            visitNode(tsInstance, node.right, visitor) as ts.Expression
        );
    
    if (config.trustGlobals)
        return node;

    const type = typeChecker.getApparentType(typeChecker.getTypeAtLocation(node.left));
    
    node = factory.updateBinaryExpression( // TODO: Why is node.right not visited in 'this.stringProperty = (a + b).toString();'?
        node,
        visitEachChild(tsInstance, node.left, visitor, ctx),
        node.operatorToken,
        visitNode(tsInstance, node.right, visitor) as ts.Expression
    );
    if (!tsInstance.isPropertyAccessExpression(node.left))
        throw new TypeError("Expected property access expression");

    if (parent && (getSymbolMetadata(symbol).intrinsic = getSymbolMetadata(parent).intrinsic))
        return factory.updateBinaryExpression(
            node,
            idlFactory.createPropertyReference(node.left.expression, symbol.name),
            node.operatorToken,
            node.right
        );

    if (type.symbol && isGlobal(type.symbol, tsInstance, typeChecker))
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