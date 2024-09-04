import type ts from "typescript";

export const makeCreateInternalGetMiscExpression =
    (internals: ts.Identifier, tsInstance: typeof ts, factory: ts.NodeFactory) =>
    (symbol: ts.Symbol): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "getMisc"),
            undefined,
            [factory.createNumericLiteral(tsInstance.getSymbolId(symbol))]
        );