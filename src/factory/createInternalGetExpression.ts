import type ts from "typescript";
import type { MetadataManager } from "../metadata";

export const makeCreateInternalGetExpression =
    (internals: ts.Identifier, factory: ts.NodeFactory, metadata: MetadataManager) =>
    (expression: ts.Expression, symbol: ts.Symbol): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "get"),
            undefined,
            [
                expression,
                factory.createPropertyAccessExpression(
                    internals,
                    `internal${metadata.getSymbolId(symbol)}`
                )
            ]
        );