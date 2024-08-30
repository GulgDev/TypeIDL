import type ts from "typescript";
import type { MetadataManager } from "../metadata";

export const makeCreateInternalSetExpression =
    (internals: ts.Identifier, factory: ts.NodeFactory, metadata: MetadataManager) =>
    (expression: ts.Expression, symbol: ts.Symbol, value: ts.Expression): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "set"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${metadata.getSymbolId(symbol)}`
                ),
                value
            ]
        );