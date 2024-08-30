import type ts from "typescript";
import type { MetadataManager } from "../metadata";

export const makeCreateInternalCallExpression =
    (internals: ts.Identifier, factory: ts.NodeFactory, metadata: MetadataManager) =>
    (expression: ts.Expression, symbol: ts.Symbol, args: ts.NodeArray<ts.Expression>): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "call"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${metadata.getSymbolId(symbol)}`
                ),
                factory.createArrayLiteralExpression(args)
            ]
        );