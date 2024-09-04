import type ts from "typescript";

export const makeCreateInternalCallExpression =
    (internals: ts.Identifier, tsInstance: typeof ts, factory: ts.NodeFactory) =>
    (expression: ts.Expression, symbol: ts.Symbol, argumentsExpression: ts.Expression): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "call"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${tsInstance.getSymbolId(symbol)}`
                ),
                argumentsExpression
            ]
        );