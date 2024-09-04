import type ts from "typescript";

export const makeCreateInstancePropertyAccessorsReference =
    (
        initializers: ts.Statement[],
        references: Map<ts.Expression, { [key: string]: [ts.Identifier, ts.Identifier] }>,
        tsInstance: typeof ts,
        factory: ts.NodeFactory
    ) =>
    (parent: ts.Expression, name: string): [ts.Identifier, ts.Identifier] => {
        let propertyReferences = references.get(parent);
        if (!propertyReferences) {
            propertyReferences = Object.create(null) as { [key: string]: [ts.Identifier, ts.Identifier] };
            references.set(parent, propertyReferences);
        }

        if (propertyReferences[name])
            return propertyReferences[name];

        const getter = factory.createUniqueName("get_" + name);
        const setter = factory.createUniqueName("set_" + name);

        initializers.push(
            factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList([
                    factory.createVariableDeclaration(
                        factory.createObjectBindingPattern([
                            factory.createBindingElement(
                                undefined,
                                factory.createIdentifier("get"),
                                getter,
                                factory.createFunctionExpression(
                                    undefined,
                                    undefined,
                                    undefined,
                                    [],
                                    undefined,
                                    undefined,
                                    factory.createBlock([
                                        factory.createReturnStatement(
                                            factory.createPropertyAccessExpression(
                                                factory.createThis(),
                                                name
                                            )
                                        )
                                    ])
                                )
                            ),
                            factory.createBindingElement(
                                undefined,
                                factory.createIdentifier("set"),
                                setter,
                                factory.createFunctionExpression(
                                    undefined,
                                    undefined,
                                    undefined,
                                    undefined,
                                    [factory.createParameterDeclaration(
                                        undefined,
                                        undefined,
                                        "value"
                                    )],
                                    undefined,
                                    factory.createBlock([
                                        factory.createReturnStatement(
                                            factory.createAssignment(
                                                factory.createPropertyAccessExpression(
                                                    factory.createThis(),
                                                    name
                                                ),
                                                factory.createIdentifier("value")
                                            )
                                        )
                                    ])
                                )
                            )
                        ]),
                        undefined,
                        undefined,
                        factory.createBinaryExpression(
                            factory.createCallExpression(
                                factory.createPropertyAccessExpression(
                                    factory.createIdentifier("Reflect"),
                                    "getOwnPropertyDescriptor"
                                ),
                                undefined,
                                [factory.createPropertyAccessExpression(
                                    parent,
                                    "prototype"
                                )]
                            ),
                            tsInstance.SyntaxKind.QuestionQuestionToken,
                            factory.createObjectLiteralExpression()
                        )
                    )
                ], tsInstance.NodeFlags.Const)
            )
        );

        return propertyReferences[name] = [getter, setter];
    };