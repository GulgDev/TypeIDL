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

export const visitPropertyAccessExpression = (state: State, visitor: Visitor): Visitor<ts.PropertyAccessExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, typeUtils, idlFactory, config, ctx } = state;

    let symbol = typeChecker.getSymbolAtLocation(node.name);
    if (!symbol)
        return visitEachChild(tsInstance, node, visitor, ctx);
    symbol = tsInstance.getSymbolTarget(symbol, typeChecker);

    if (isInternal(symbol, typeChecker))
        return idlFactory.createInternalGetExpression(
            visitNode(tsInstance, node.expression, visitor) as ts.Expression,
            symbol
        );
    
    const parent = typeChecker.getSymbolAtLocation(node.expression);

    if (parent && hasIDL(parent, config.useIDLDecorator, tsInstance, typeUtils))
        return idlFactory.createInternalGetExpression(
            visitNode(tsInstance, node.expression, visitor) as ts.Expression,
            createMirror(symbol, typeChecker)
        );

    const type = typeChecker.getApparentType(typeChecker.getTypeAtLocation(node.expression));
    
    node = visitEachChild(tsInstance, node, visitor, ctx);

    if (config.trustGlobals)
        return node;

    if (parent && (getSymbolMetadata(symbol).intrinsic = getSymbolMetadata(parent).intrinsic))
        return idlFactory.createPropertyReference(node.expression, symbol.name);

    if (type.symbol && isGlobal(type.symbol, tsInstance, typeChecker))
        return symbol.flags & tsInstance.SymbolFlags.Method ?
            idlFactory.createInstanceMethodReference(
                idlFactory.createGlobalReference(type.symbol.name),
                symbol.name
            ) :
            idlFactory.createFunctionApplyCall(
                idlFactory.createInstancePropertyAccessorsReference(
                    idlFactory.createGlobalReference(type.symbol.name),
                    symbol.name
                )[0],
                visitNode(tsInstance, node.expression, visitor) as ts.Expression
            );

    return node;
};