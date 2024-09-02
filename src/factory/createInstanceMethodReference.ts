import type ts from "typescript";

export const makeCreateInstanceMethodReference =
    (
        initializers: ts.Statement[],
        references: Map<ts.Expression, { [key: string]: ts.Identifier }>,
        tsInstance: typeof ts,
        factory: ts.NodeFactory
    ) =>
    (parent: ts.Expression, name: string): ts.Identifier => {
        let methodReferences = references.get(parent);
        if (!methodReferences) {
            methodReferences = {};
            references.set(parent, methodReferences);
        }

        if (methodReferences[name])
            return methodReferences[name];

        const ident = factory.createUniqueName(name);

        initializers.push(
            factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList([
                    factory.createVariableDeclaration(
                        factory.createObjectBindingPattern([
                            factory.createBindingElement(
                                undefined,
                                factory.createIdentifier(name),
                                ident
                            )
                        ]),
                        undefined,
                        undefined,
                        factory.createPropertyAccessExpression(
                            parent,
                            "prototype"
                        )
                    )
                ], tsInstance.NodeFlags.Let)
            )
        );

        return methodReferences[name] = ident;
    };