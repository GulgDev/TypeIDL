import type ts from "typescript";

export const makeCreateInternalSetExpression =
    (internals: ts.Identifier, tsInstance: typeof ts, factory: ts.NodeFactory) =>
    (expression: ts.Expression, symbol: ts.Symbol, value: ts.Expression): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "set"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${tsInstance.getSymbolId(symbol)}`
                ),
                value
            ]
        );