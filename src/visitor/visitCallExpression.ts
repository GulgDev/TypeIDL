import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { getSymbolMetadata } from "../metadata";
import { createMirror } from "../util/createMirror";
import { hasIDL } from "../util/hasIDL";
import { isInternal } from "../util/isInternal";
import { isGlobal } from "../util/isGlobal";
import visitNode from "./util/visitNode";
import visitNodes from "./util/visitNodes";
import visitEachChild from "./util/visitEachChild";

export const visitCallExpression = (state: State, visitor: Visitor): Visitor<ts.CallExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, typeUtils, factory, idlFactory, config, ctx } = state;

    if (!tsInstance.isPropertyAccessExpression(node.expression))
        return visitEachChild(tsInstance, node, visitor, ctx);

    let symbol = typeChecker.getSymbolAtLocation(node.expression.name);
    if (!symbol)
        return visitEachChild(tsInstance, node, visitor, ctx);
    symbol = tsInstance.getSymbolTarget(symbol, typeChecker);

    if (isInternal(symbol, typeChecker))
        return idlFactory.createInternalCallExpression(
            visitNode(tsInstance, node.expression.expression, visitor) as ts.Expression,
            symbol,
            factory.createArrayLiteralExpression(
                visitNodes(tsInstance, node.arguments, visitor) as ts.NodeArray<ts.Expression>
            )
        );
    
    const parent = typeChecker.getSymbolAtLocation(node.expression.expression);
    
    if (parent && hasIDL(parent, config.useIDLDecorator, tsInstance, typeUtils))
        return idlFactory.createInternalCallExpression(
            visitNode(tsInstance, node.expression.expression, visitor) as ts.Expression,
            createMirror(symbol, typeChecker),
            factory.createArrayLiteralExpression(
                visitNodes(tsInstance, node.arguments, visitor) as ts.NodeArray<ts.Expression>
            )
        );
    
    if (config.trustGlobals)
        return visitEachChild(tsInstance, node, visitor, ctx);

    const functionSymbol = typeChecker.resolveName(
        "Function",
        undefined,
        tsInstance.SymbolFlags.Class | tsInstance.SymbolFlags.Interface,
        false
    );
    if (functionSymbol) {
        const functionConstructor = typeChecker.getTypeOfSymbol(functionSymbol);
        if (symbol === functionConstructor.getProperty("apply"))
            return idlFactory.createFunctionApplyCall(
                visitNode(tsInstance, node.expression.expression, visitor) as ts.Expression,
                visitNode(tsInstance, node.arguments[0], visitor) as ts.Expression,
                visitNode(tsInstance, node.arguments[1], visitor) as ts.Expression
            );
        else if (symbol === functionConstructor.getProperty("call"))
            return idlFactory.createFunctionApplyCall(
                visitNode(tsInstance, node.expression.expression, visitor) as ts.Expression,
                visitNode(tsInstance, node.arguments[0], visitor) as ts.Expression,
                factory.createArrayLiteralExpression(
                    visitNodes(tsInstance, node.arguments, visitor, 1) as ts.NodeArray<ts.Expression>
                )
            );
    }

    const type = typeChecker.getApparentType(typeChecker.getTypeAtLocation(node.expression.expression));
    
    node = factory.updateCallExpression(
        node,
        visitEachChild(tsInstance, node.expression, visitor, ctx),
        visitNodes(tsInstance, node.typeArguments, visitor) as ts.NodeArray<ts.TypeNode>,
        visitNodes(tsInstance, node.arguments, visitor) as ts.NodeArray<ts.Expression>
    );
    if (!tsInstance.isPropertyAccessExpression(node.expression))
        throw new TypeError("Expected property access expression");

    if (parent && (getSymbolMetadata(symbol).fresh = getSymbolMetadata(parent).fresh))
        return node;
    
    let method;
    if (parent && (getSymbolMetadata(symbol).intrinsic = getSymbolMetadata(parent).intrinsic))
        method = idlFactory.createPropertyReference(node.expression.expression, symbol.name);
    else if (type.symbol && isGlobal(type.symbol, tsInstance, typeChecker))
        method = idlFactory.createInstanceMethodReference(
            idlFactory.createGlobalReference(type.symbol.name),
            symbol.name
        );
    else
        return node;

    return idlFactory.createFunctionApplyCall(
        method,
        node.expression.expression,
        factory.createArrayLiteralExpression(node.arguments)
    );
};