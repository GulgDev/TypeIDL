import type ts from "typescript";
import type { MetadataManager } from "../metadata";

export const makeCreateInternalSetMiscExpression =
    (internals: ts.Identifier, factory: ts.NodeFactory, metadata: MetadataManager) =>
    (symbol: ts.Symbol, value: ts.Expression): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(internals, "misc"),
                "set"
            ),
            undefined,
            [
                factory.createNumericLiteral(metadata.getSymbolId(symbol)),
                value
            ]
        );