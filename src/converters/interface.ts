import type ts from "typescript";
import { State } from "..";
import makeConverter from ".";
import stringifyType from "../util/stringifyType";

export default function makeInterfaceConverter(state: State, type: ts.InterfaceType): ts.Statement[] {
    const { factory, idlFactory, typeChecker } = state;

    const result: ts.Statement[] = [];

    result.push(
        factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
                [factory.createVariableDeclaration(
                    "cached",
                    undefined,
                    typeChecker.typeToTypeNode(type, undefined, undefined),
                    idlFactory.createMethodCall(
                        "WeakMap",
                        "get",
                        factory.createIdentifier("cache"),
                        [factory.createIdentifier("value")]
                    )
                )],
                state.tsInstance.NodeFlags.Const
            )
        ),
        factory.createIfStatement(
            factory.createStrictInequality(
                factory.createIdentifier("cached"),
                factory.createVoidZero()
            ),
            factory.createReturnStatement(
                factory.createIdentifier("cached")
            )
        )
    );

    result.push(
        factory.createIfStatement(
            factory.createEquality(
                factory.createIdentifier("value"),
                factory.createNull()
            ),
            factory.createExpressionStatement(
                factory.createAssignment(
                    factory.createIdentifier("value"),
                    factory.createObjectLiteralExpression()
                )
            ),
            factory.createIfStatement(
                factory.createLogicalAnd(
                    factory.createStrictInequality(
                        factory.createTypeOfExpression(
                            factory.createIdentifier("value")
                        ),
                        factory.createStringLiteral("object")
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
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        )
    );
    result.push(
        factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
                [factory.createVariableDeclaration(
                    "converted",
                    undefined,
                    typeChecker.typeToTypeNode(type, undefined, undefined),
                    factory.createObjectLiteralExpression()
                )],
                state.tsInstance.NodeFlags.Const
            )
        )
    );
    result.push(
        factory.createExpressionStatement(
            idlFactory.createMethodCall(
                "WeakMap",
                "set",
                factory.createIdentifier("cache"),
                [
                    factory.createIdentifier("value"),
                    factory.createIdentifier("converted")
                ]
            )
        )
    );
    for (const property of type.getApparentProperties()) {
        const propertyType = typeChecker.getTypeOfSymbol(property);
        result.push(
            factory.createExpressionStatement(
                factory.createAssignment(
                    factory.createPropertyAccessExpression(
                        factory.createIdentifier("converted"),
                        property.name
                    ),
                    factory.createCallExpression(
                        makeConverter(state, propertyType),
                        undefined,
                        [
                            factory.createPropertyAccessExpression(
                                factory.createIdentifier("value"),
                                property.name
                            ),
                            factory.createStringLiteral(
                                `Failed to read the '${
                                    property.name
                                }' property from '${
                                    type.symbol.name
                                }': The provided value is not of type '${
                                    stringifyType(state, propertyType)
                                }'.`
                            ),
                            factory.createIdentifier("cache")
                        ]
                    )
                )
            )
        );
    }
    result.push(
        factory.createExpressionStatement(
            factory.createAssignment(
                factory.createIdentifier("value"),
                factory.createIdentifier("converted")
            )
        )
    );
    return result;
}