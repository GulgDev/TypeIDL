import type ts from "typescript";
import type { MetadataManager } from "../metadata";

export const makeCreateInternalGetMiscExpression =
    (internals: ts.Identifier, factory: ts.NodeFactory, metadata: MetadataManager) =>
    (symbol: ts.Symbol): ts.Expression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(internals, "misc"),
                "get"
            ),
            undefined,
            [factory.createNumericLiteral(metadata.getSymbolId(symbol))]
        );