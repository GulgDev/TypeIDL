import type ts from "typescript";

export const makeCreateInternalSetMiscExpression =
    (internals: ts.Identifier, tsInstance: typeof ts, factory: ts.NodeFactory) =>
    (symbol: ts.Symbol, value: ts.Expression): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "setMisc"),
            undefined,
            [
                factory.createNumericLiteral(tsInstance.getSymbolId(symbol)),
                value
            ]
        );