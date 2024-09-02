import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { isInternal } from "../util/isInternal";
import { isGlobal } from "../util/isGlobal";
import visitNode from "./util/visitNode";
import visitEachChild from "./util/visitEachChild";

export const visitPropertyAccessExpression = (state: State, visitor: Visitor): Visitor<ts.PropertyAccessExpression> => (_hint, node) => {
    const { tsInstance, typeChecker, idlFactory, config, ctx, metadata } = state;

    const symbol = typeChecker.getSymbolAtLocation(node.name);
    if (!symbol)
        return visitEachChild(tsInstance, node, visitor, ctx);

    if (isInternal(metadata, symbol, typeChecker))
        return idlFactory.createInternalGetExpression(
            visitNode(tsInstance, node.expression, visitor) as ts.Expression,
            symbol
        );
    
    const parent = typeChecker.getSymbolAtLocation(node.expression);
    
    node = visitEachChild(tsInstance, node, visitor, ctx);

    if (config.trustGlobals)
        return node;

    if (parent && (metadata.getSymbolMetadata(symbol).intrinsic = metadata.getSymbolMetadata(parent).intrinsic))
        return idlFactory.createPropertyReference(node.expression, symbol.name);

    const type = typeChecker.getTypeAtLocation(node.expression);
    if (type.symbol && isGlobal(metadata, type.symbol, tsInstance, typeChecker))
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