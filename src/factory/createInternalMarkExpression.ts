import type ts from "typescript";
import type { MetadataManager } from "../metadata";

export const makeCreateInternalMarkExpression =
    (internals: ts.Identifier, factory: ts.NodeFactory, metadata: MetadataManager) =>
    (expression: ts.Expression, symbol: ts.Symbol): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "mark"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${metadata.getSymbolId(symbol)}`
                )
            ]
        );