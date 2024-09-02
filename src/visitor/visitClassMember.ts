import type { State } from "..";
import type { ClassContext } from "./visitClassDeclaration";
import type { Visitor } from "./util";
import { isInternal } from "../util/isInternal";
import makeMethodValidators from "../validators";

export const visitClassMember = (state: State, classCtx: ClassContext): Visitor => (_hint, node) => {
    const { tsInstance, typeChecker, factory, idlFactory, metadata } = state;
    const { classSymbol, classType, applyIDL, initializers } = classCtx;

    if (tsInstance.isMethodDeclaration(node) && node.body) {
        const symbol = typeChecker.getSymbolAtLocation(node.name)!;
        if (symbol.name.startsWith("#"))
            return node;
        const type = typeChecker.getNonNullableType(typeChecker.getTypeOfSymbol(symbol));

        if (isInternal(metadata, symbol, typeChecker)) {
            state.addInternal(symbol);
            initializers.push(
                idlFactory.createInternalSetExpression(
                    factory.createThis(),
                    symbol,
                    factory.createFunctionExpression(
                        undefined,
                        node.asteriskToken,
                        symbol.name,
                        node.typeParameters,
                        node.parameters,
                        node.type,
                        node.body
                    )
                )
            );
            return;
        } else if (applyIDL)
            return factory.updateMethodDeclaration(
                node,
                node.modifiers,
                node.asteriskToken,
                node.name,
                node.questionToken,
                node.typeParameters,
                node.parameters,
                node.type,
                factory.updateBlock(node.body, [
                    ...makeMethodValidators(
                        state,
                        classSymbol,
                        node.modifiers?.find((modifier) => modifier.kind === tsInstance.SyntaxKind.StaticKeyword) != null,
                        type.getCallSignatures()[0],
                        `Failed to execute '${symbol.name}' on '${classSymbol.name}'`
                    ),
                    ...node.body.statements
                ])
            );
    } else if (tsInstance.isPropertyDeclaration(node)) {
        const symbol = typeChecker.getSymbolAtLocation(node.name)!;
        if (symbol.name.startsWith("#"))
            return node;

        if (isInternal(metadata, symbol, typeChecker)) {
            state.addInternal(symbol);
            if (node.initializer)
                initializers.push(
                    idlFactory.createInternalSetExpression(
                        factory.createThis(),
                        symbol,
                        node.initializer
                    )
                );
            return;
        } else if (applyIDL) {
            const type = typeChecker.getTypeAtLocation(node.type!);

            const existingProperty = typeChecker.getPrivateIdentifierPropertyOfType(classType, "#" + symbol.name, node);
            const useExisting =
                existingProperty != null &&
                typeChecker.isTypeAssignableTo(type, typeChecker.getTypeOfSymbol(existingProperty));

            const privateName = useExisting ?
                factory.createPrivateIdentifier("#" + symbol.name) :
                factory.createUniquePrivateName("#" + symbol.name);

            const accessorsModifiers = node.modifiers?.filter((modifier) => 
                modifier.kind === tsInstance.SyntaxKind.StaticKeyword);

            const declaration = useExisting ? [] : [
                factory.updatePropertyDeclaration(
                    node,
                    node.modifiers,
                    privateName,
                    node.questionToken ?? node.exclamationToken,
                    node.type,
                    node.initializer
                )
            ];

            if (node.modifiers?.find((modifier) => modifier.kind === tsInstance.SyntaxKind.ReadonlyKeyword)) {
                // TODO
                // mappedProps[symbol.name] = privateName;
                return [
                    ...declaration,
                    factory.createGetAccessorDeclaration(
                        accessorsModifiers,
                        node.name,
                        [],
                        node.type,
                        factory.createBlock([
                            factory.createReturnStatement(
                                factory.createPropertyAccessExpression(
                                    factory.createThis(),
                                    privateName
                                )
                            )
                        ])
                    )
                ];
            } else {
                const valueParameterDeclaration = factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    "value",
                    undefined,
                    node.type,
                    undefined
                );
                const setAccessor = factory.createSetAccessorDeclaration(
                    accessorsModifiers,
                    node.name,
                    [valueParameterDeclaration],
                    factory.createBlock([
                        factory.createExpressionStatement(
                            factory.createAssignment(
                                factory.createPropertyAccessExpression(
                                    factory.createThis(),
                                    privateName
                                ),
                                factory.createIdentifier("value")
                            )
                        )
                    ], true)
                );
                tsInstance.setParentRecursive(setAccessor, false);
                const valueParameter = typeChecker.createSymbol(
                    tsInstance.SymbolFlags.FunctionScopedVariable,
                    factory.createIdentifier("value").escapedText
                );
                valueParameter.valueDeclaration = valueParameterDeclaration;
                return [
                    ...declaration,
                    factory.createGetAccessorDeclaration(
                        accessorsModifiers,
                        node.name,
                        [],
                        node.type,
                        factory.createBlock([
                            factory.createReturnStatement(
                                factory.createPropertyAccessExpression(
                                    factory.createThis(),
                                    privateName
                                )
                            )
                        ])
                    ),
                    factory.updateSetAccessorDeclaration(
                        setAccessor,
                        setAccessor.modifiers,
                        setAccessor.name,
                        setAccessor.parameters,
                        factory.updateBlock(
                            setAccessor.body!,
                            [
                                ...makeMethodValidators(
                                    state,
                                    classSymbol,
                                    node.modifiers?.find((modifier) => modifier.kind === tsInstance.SyntaxKind.StaticKeyword) != null,
                                    typeChecker.createSignature(
                                        undefined,
                                        undefined,
                                        undefined,
                                        [valueParameter],
                                        typeChecker.getAnyType(),
                                        undefined,
                                        1,
                                        tsInstance.SignatureFlags.None
                                    ),
                                    `Failed to set the '${symbol.name}' property on '${classSymbol.name}'`
                                ),
                                ...setAccessor.body!.statements
                            ]
                        )
                    )
                ];
            }
        }
    } else if (tsInstance.isSetAccessorDeclaration(node) && node.body && applyIDL) {
        const symbol = typeChecker.getSymbolAtLocation(node.name)!;
        if (symbol.name.startsWith("#"))
            return node;
        const type = typeChecker.getTypeOfSymbol(symbol);
        return factory.updateSetAccessorDeclaration(
            node,
            node.modifiers,
            node.name,
            node.parameters,
            factory.updateBlock(node.body, [
                ...makeMethodValidators(
                    state,
                    classSymbol,
                    node.modifiers?.find((modifier) => modifier.kind === tsInstance.SyntaxKind.StaticKeyword) != null,
                    type.getCallSignatures()[0],
                    `Failed to set an indexed property '${symbol.name}' on '${classSymbol.name}'`
                ),
                ...node.body.statements
            ])
        );
    }

    return node;
};