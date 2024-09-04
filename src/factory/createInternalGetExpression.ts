import type ts from "typescript";

export const makeCreateInternalGetExpression =
    (internals: ts.Identifier, tsInstance: typeof ts, factory: ts.NodeFactory) =>
    (expression: ts.Expression, symbol: ts.Symbol): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "get"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${tsInstance.getSymbolId(symbol)}`
                )
            ]
        );