import type ts from "typescript";
import type { State } from "..";
import type { ClassContext } from "./visitClassDeclaration";
import type { Visitor } from "./util";
import { createMirror } from "../util/createMirror";
import { isInternal } from "../util/isInternal";
import makeMethodValidators from "../validators";

export const visitClassMember = (state: State, classCtx: ClassContext): Visitor => (_hint, node) => {
    const { tsInstance, typeChecker, factory, idlFactory } = state;
    const { classSymbol, applyIDL, initializers, staticInitializers } = classCtx;

    if (tsInstance.isMethodDeclaration(node) && node.body) {
        const symbol = typeChecker.getSymbolAtLocation(node.name)!;
        if (symbol.name.startsWith("#"))
            return node;
        const type = typeChecker.getNonNullableType(typeChecker.getTypeOfSymbol(symbol));

        const isStatic = (tsInstance.modifiersToFlags(node.modifiers) & tsInstance.ModifierFlags.Static) !== 0;

        const self = isStatic ? factory.createIdentifier(classSymbol.name) : factory.createThis();
        const initializersTarget = isStatic ? staticInitializers : initializers;

        if (isInternal(symbol, typeChecker)) {
            state.addInternal(symbol);
            initializersTarget.push(
                idlFactory.createInternalSetExpression(
                    self,
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
        } else if (applyIDL) {
            const mirrorSymbol = createMirror(symbol, typeChecker);
            state.addInternal(mirrorSymbol);
            initializersTarget.push(
                idlFactory.createInternalSetExpression(
                    self,
                    mirrorSymbol,
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
            
            return factory.createMethodDeclaration(
                node.modifiers,
                node.asteriskToken,
                node.name,
                node.questionToken,
                node.typeParameters,
                node.parameters.map((parameter, index) =>
                    factory.createParameterDeclaration(
                        parameter.modifiers,
                        parameter.dotDotDotToken,
                        factory.createIdentifier("arg" + index),
                        parameter.questionToken,
                        parameter.type,
                        parameter.initializer
                    )
                ),
                node.type,
                factory.createBlock([
                    ...makeMethodValidators(
                        state,
                        classSymbol,
                        isStatic,
                        type.getCallSignatures()[0],
                        `Failed to execute '${symbol.name}' on '${classSymbol.name}'`
                    ),
                    factory.createReturnStatement(
                        idlFactory.createInternalCallExpression(
                            self,
                            mirrorSymbol,
                            factory.createArrayLiteralExpression(
                                node.parameters.map((parameter, index) => {
                                    let node: ts.Expression = factory.createIdentifier("arg" + index);
                                    if (parameter.dotDotDotToken)
                                        node = factory.createSpreadElement(node);
                                    return node;
                                })
                            )
                        )
                    )
                ], true)
            );
        }
    } else if (tsInstance.isPropertyDeclaration(node)) {
        const symbol = typeChecker.getSymbolAtLocation(node.name)!;
        if (symbol.name.startsWith("#"))
            return node;

        const isStatic = (tsInstance.modifiersToFlags(node.modifiers) & tsInstance.ModifierFlags.Static) !== 0;

        const self = isStatic ? factory.createIdentifier(classSymbol.name) : factory.createThis();
        const initializersTarget = isStatic ? staticInitializers : initializers;

        if (isInternal(symbol, typeChecker)) {
            state.addInternal(symbol);
            initializersTarget.push(
                idlFactory.createInternalSetExpression(
                    self,
                    symbol,
                    node.initializer ?? factory.createVoidZero()
                )
            );
            return;
        } else if (applyIDL) {
            const mirrorSymbol = createMirror(symbol, typeChecker);
            state.addInternal(mirrorSymbol);
            initializersTarget.push(
                idlFactory.createInternalSetExpression(
                    self,
                    mirrorSymbol,
                    node.initializer ?? factory.createVoidZero()
                )
            );

            const getAccessor = factory.createGetAccessorDeclaration(
                node.modifiers,
                node.name,
                [],
                node.type,
                factory.createBlock([
                    factory.createReturnStatement(
                        idlFactory.createInternalGetExpression(
                            self,
                            mirrorSymbol
                        )
                    )
                ])
            );

            if (node.modifiers?.find((modifier) => modifier.kind === tsInstance.SyntaxKind.ReadonlyKeyword))
                return getAccessor;
            else {
                const valueParameterDeclaration = factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    "arg0",
                    undefined,
                    node.type,
                    undefined
                );
                const setAccessor = factory.createSetAccessorDeclaration(
                    node.modifiers,
                    node.name,
                    [valueParameterDeclaration],
                    factory.createBlock([
                        factory.createExpressionStatement(
                            idlFactory.createInternalSetExpression(
                                self,
                                mirrorSymbol,
                                factory.createIdentifier("arg0")
                            )
                        )
                    ], true)
                );
                tsInstance.setParentRecursive(setAccessor, false);
                const valueParameter = typeChecker.createSymbol(
                    tsInstance.SymbolFlags.FunctionScopedVariable,
                    "arg0" as ts.__String
                );
                valueParameter.valueDeclaration = valueParameterDeclaration;
                //valueParameterDeclaration.symbol = valueParameter;
                tsInstance.setParent(setAccessor, classCtx.classDeclaration);
                return [
                    getAccessor,
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
                                    isStatic,
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

        const isStatic = (tsInstance.modifiersToFlags(node.modifiers) & tsInstance.ModifierFlags.Static) !== 0;

        const type = typeChecker.getTypeOfSymbol(symbol);
        return factory.updateSetAccessorDeclaration(
            node,
            node.modifiers,
            node.name,
            node.parameters.map((parameter, index) =>
                factory.createParameterDeclaration(
                    parameter.modifiers,
                    parameter.dotDotDotToken,
                    factory.createIdentifier("arg" + index),
                    parameter.questionToken,
                    parameter.type,
                    parameter.initializer
                )
            ),
            factory.updateBlock(node.body, [
                ...makeMethodValidators(
                    state,
                    classSymbol,
                    isStatic,
                    type.getCallSignatures()[0],
                    `Failed to set an indexed property '${symbol.name}' on '${classSymbol.name}'`
                ),
                factory.createVariableStatement(
                    undefined,
                    factory.createVariableDeclarationList(
                        [factory.createVariableDeclaration(
                            factory.createArrayBindingPattern([
                                ...node.parameters.map((parameter) =>
                                    factory.createBindingElement(
                                        parameter.dotDotDotToken,
                                        undefined,
                                        parameter.name,
                                        parameter.initializer
                                    )
                                )
                            ]),
                            undefined,
                            undefined,
                            factory.createArrayLiteralExpression(
                                node.parameters.map((parameter, index) => {
                                    let node: ts.Expression = factory.createIdentifier("arg" + index);
                                    if (parameter.dotDotDotToken)
                                        node = factory.createSpreadElement(node);
                                    return node;
                                })
                            )
                        )],
                        tsInstance.NodeFlags.Let
                    )
                ),
                ...node.body.statements
            ])
        );
    }

    return node;
};