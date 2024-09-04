import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import makeMethodValidators from "../validators";
import { visitClassMember } from "./visitClassMember";
import { isInternalConstructor } from "../util/isInternalConstructor";
import { hasIDL } from "../util/hasIDL";
import visitEachChild from "./util/visitEachChild";

export interface ClassContext {
    classDeclaration: ts.ClassDeclaration;
    classSymbol: ts.Symbol;
    classType: ts.Type;
    baseType?: ts.BaseType;

    applyIDL: boolean;

    initializers: ts.Expression[];
    staticInitializers: ts.Expression[];
}

export const visitClassDeclaration = (state: State, visitor: Visitor): Visitor<ts.ClassDeclaration> => (_hint, node) => {
    if (!node.name)
        return node;

    const { tsInstance, typeChecker, typeUtils, factory, idlFactory, config, ctx } = state;

    let classDeclaration = visitEachChild(tsInstance, node, visitor, ctx);

    const classSymbol = typeChecker.getSymbolAtLocation(classDeclaration.name!)!;
    const classType = typeChecker.getTypeOfSymbolAtLocation(classSymbol, classDeclaration);

    const applyIDL = hasIDL(classSymbol, config.useIDLDecorator, tsInstance, typeUtils);

    const baseType = typeChecker.getTypeAtLocation(classDeclaration.name!).getBaseTypes()?.[0];

    const initializers: ts.Expression[] = [
        idlFactory.createInternalMarkExpression(
            factory.createThis(),
            classSymbol
        )
    ];

    const staticInitializers: ts.Expression[] = [];

    const classCtx: ClassContext = {
        classDeclaration,
        classSymbol,
        classType,
        baseType,

        applyIDL,

        initializers,
        staticInitializers
    };

    classDeclaration = visitEachChild(tsInstance, classDeclaration, visitClassMember(state, classCtx), ctx);

    const visitInsideConstructor: Visitor = (_hint, node) => {
        if (tsInstance.isCallExpression(node) && node.expression.kind === tsInstance.SyntaxKind.SuperKeyword) {
            const callExpr = visitEachChild(tsInstance, node, visitInsideConstructor, ctx) as ts.CallExpression;
            return factory.createCommaListExpression([
                factory.updateCallExpression(
                    callExpr,
                    callExpr.expression,
                    callExpr.typeArguments,
                    [
                        idlFactory.createInternalGetMiscExpression(baseType!.symbol),
                        ...callExpr.arguments
                    ]
                ),
                ...initializers,
                factory.createThis()
            ]);
        }

        return visitEachChild(tsInstance, node, visitInsideConstructor, ctx);
    }

    let hasConstructor = false;
    let hasInternalConstructor = false;

    classDeclaration = visitEachChild(tsInstance, classDeclaration, (_hint, node) => {
        if (tsInstance.isConstructorDeclaration(node) && node.body) {
            hasConstructor = true;

            const tags = ((node.original as ts.ConstructorDeclaration ?? node).symbol as ts.Symbol).getJsDocTags(typeChecker); // TODO
            if (tags.find((tag) => tag.name === "internal") != null)
                hasInternalConstructor = true;

            const body = visitEachChild(tsInstance, node.body, visitInsideConstructor, ctx);
            
            if (applyIDL)
                return factory.updateConstructorDeclaration(
                    node,
                    node.modifiers,
                    hasInternalConstructor ?
                        [] :
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
                    factory.updateBlock(
                        body,
                        [
                            ...hasInternalConstructor ?
                                [
                                    factory.createIfStatement(
                                        factory.createStrictInequality(
                                            factory.createElementAccessExpression(
                                                factory.createIdentifier("arguments"),
                                                factory.createNumericLiteral(0)
                                            ),
                                            idlFactory.createInternalGetMiscExpression(classSymbol)
                                        ),
                                        factory.createThrowStatement(
                                            factory.createNewExpression(
                                                idlFactory.createGlobalReference("TypeError"),
                                                undefined,
                                                [factory.createStringLiteral("Illegal constructor")]
                                            )
                                        )
                                    ),
                                    factory.createVariableStatement(
                                        undefined,
                                        factory.createVariableDeclarationList(
                                            [factory.createVariableDeclaration(
                                                factory.createArrayBindingPattern([
                                                    factory.createOmittedExpression(),
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
                                                factory.createIdentifier("arguments")
                                            )],
                                            tsInstance.NodeFlags.Let
                                        )
                                    )
                                ] :
                                [
                                    ...makeMethodValidators(
                                        state, classSymbol, true, classType.getConstructSignatures()[0],
                                        `Failed to construct '${classSymbol.name}'`),
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
                                    )
                                ],
                            ...baseType ? [] : initializers.map(factory.createExpressionStatement),
                            ...body.statements
                        ]
                    )
                );
        }

        return node;
    }, ctx);

    let insertInternalConstructor = !hasConstructor && config.treatMissingConstructorAsInternal;

    if (insertInternalConstructor)
        classDeclaration = factory.updateClassDeclaration(
            classDeclaration,
            classDeclaration.modifiers,
            classDeclaration.name,
            classDeclaration.typeParameters,
            classDeclaration.heritageClauses,
            [
                factory.createConstructorDeclaration(
                    undefined,
                    [],
                    factory.createBlock([
                        factory.createIfStatement(
                            factory.createStrictInequality(
                                factory.createElementAccessExpression(
                                    factory.createIdentifier("arguments"),
                                    factory.createNumericLiteral(0)
                                ),
                                idlFactory.createInternalGetMiscExpression(classSymbol)
                            ),
                            factory.createThrowStatement(
                                factory.createNewExpression(
                                    idlFactory.createGlobalReference("TypeError"),
                                    undefined,
                                    [factory.createStringLiteral("Illegal constructor")]
                                )
                            )
                        ),
                        ...initializers.map(factory.createExpressionStatement)
                    ], true)
                ),
                ...classDeclaration.members
            ]
        );

    const declarationsName = factory.createUniqueName("_");

    state.addMark(classSymbol);

    return [
        factory.updateClassDeclaration(
            classDeclaration,
            classDeclaration.modifiers,
            classDeclaration.name,
            classDeclaration.typeParameters,
            classDeclaration.heritageClauses,
            [
                ...classDeclaration.members,
                ...staticInitializers.length === 0 ? [] : [factory.createPropertyDeclaration(
                    factory.createModifiersFromModifierFlags(tsInstance.ModifierFlags.Static),
                    declarationsName,
                    undefined,
                    undefined,
                    factory.createCommaListExpression(staticInitializers)
                )]
            ]
        ),
        ...isInternalConstructor(classSymbol, config.treatMissingConstructorAsInternal, tsInstance, typeChecker) ?
            [idlFactory.createInternalSetMiscExpression(
                classSymbol,
                factory.createCallExpression(
                    idlFactory.createGlobalReference("Symbol"),
                    undefined,
                    []
                )
            )] : [],
        ...staticInitializers.length === 0 ? [] : [factory.createExpressionStatement(
            factory.createDeleteExpression(
                factory.createPropertyAccessExpression(
                    factory.createIdentifier(classSymbol.name),
                    declarationsName
                )
            )
        )]
    ];
};