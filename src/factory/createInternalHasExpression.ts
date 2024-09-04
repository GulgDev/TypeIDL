import type ts from "typescript";

export const makeCreateInternalHasExpression =
    (internals: ts.Identifier, tsInstance: typeof ts, factory: ts.NodeFactory) =>
    (expression: ts.Expression, symbol: ts.Symbol): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "has"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${tsInstance.getSymbolId(symbol)}`
                )
            ]
        );