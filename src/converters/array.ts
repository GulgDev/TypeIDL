import type ts from "typescript";
import type { State } from "..";
import makeConverter from ".";

export default function makeArrayConverter(state: State, type: ts.Type): ts.Statement[] {
    const { tsInstance, typeChecker, factory } = state;
    
    const elementType = typeChecker.getElementTypeOfArrayType(type)!;
    return [
        factory.createIfStatement(
            factory.createLogicalAnd(
                factory.createLogicalOr(
                    factory.createStrictInequality(
                        factory.createTypeOfExpression(
                            factory.createIdentifier("value")
                        ),
                        factory.createStringLiteral("object")
                    ),
                    factory.createStrictEquality(
                        factory.createIdentifier("value"),
                        factory.createNull()
                    )
                ),
                factory.createStrictInequality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("function")
                )
            ),
            factory.createThrowStatement(
                factory.createNewExpression(
                    factory.createIdentifier("TypeError"),
                    undefined,
                    [factory.createIdentifier("errorMessage")]
                )
            )
        ),
        factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList([
                factory.createVariableDeclaration(
                    "result",
                    undefined,
                    undefined,
                    factory.createArrayLiteralExpression()
                )
            ], tsInstance.NodeFlags.Const)
        ),
        factory.createForOfStatement(
            undefined,
            factory.createVariableDeclarationList([
                factory.createVariableDeclaration("element")
            ], tsInstance.NodeFlags.Const),
            factory.createIdentifier("value"),
            factory.createExpressionStatement(
                factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                        factory.createIdentifier("result"),
                        "push"
                    ),
                    undefined,
                    [factory.createCallExpression(
                        makeConverter(state, elementType),
                        undefined,
                        [factory.createIdentifier("element")]
                    )]
                )
            )
        ),
        factory.createReturnStatement(
            factory.createIdentifier("result")
        )
    ];
}