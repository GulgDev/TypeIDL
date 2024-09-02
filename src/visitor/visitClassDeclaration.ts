import type ts from "typescript";
import type { State } from "..";
import type { Visitor } from "./util";
import { resolve } from "path";
import makeMethodValidators from "../validators";
import { visitClassMember } from "./visitClassMember";
import { isInternalConstructor } from "../util/isInternalConstructor";
import visitEachChild from "./util/visitEachChild";

export interface ClassContext {
    classSymbol: ts.Symbol;
    classType: ts.Type;
    baseType?: ts.BaseType;

    applyIDL: boolean;

    initializers: ts.Expression[];
}

export const visitClassDeclaration = (state: State, visitor: Visitor): Visitor<ts.ClassDeclaration> => (_hint, node) => {
    if (!node.name)
        return node;

    const { tsInstance, typeChecker, typeUtils, factory, idlFactory, config, ctx, metadata } = state;

    let classDeclaration = visitEachChild(tsInstance, node, visitor, ctx);

    let applyIDL: boolean = true;
    if (config.useIDLDecorator) {
        const decorators = tsInstance.getDecorators(classDeclaration);
        applyIDL = !!(decorators && decorators.find((decorator) => {
            const symbol = typeUtils.getSymbol(decorator.expression);
            return resolve(typeUtils.getDeclaredFileName(symbol)) === resolve(__dirname, "../index.d.ts") &&
                    symbol.name === "idl";
        }));
    }

    const classSymbol = typeChecker.getSymbolAtLocation(classDeclaration.name!)!;
    const classType = typeChecker.getTypeOfSymbolAtLocation(classSymbol, classDeclaration);

    const baseType = typeChecker.getTypeAtLocation(classDeclaration.name!).getBaseTypes()?.[0];

    const mappedProps: { [key: string]: ts.Identifier | ts.PrivateIdentifier } = {};

    const initializers: ts.Expression[] = [
        idlFactory.createInternalMarkExpression(
            factory.createThis(),
            classSymbol
        )
    ];

    const miscDeclarations: ts.Expression[] = [];

    const classCtx: ClassContext = {
        classSymbol,
        classType,
        baseType,

        applyIDL,

        initializers
    };

    classDeclaration = visitEachChild(tsInstance, classDeclaration, visitClassMember(state, classCtx), ctx);

    const visitInsideConstructor: Visitor = (_hint, node) => {
        if (tsInstance.isBinaryExpression(node) && node.operatorToken.kind === tsInstance.SyntaxKind.EqualsToken &&
            tsInstance.isPropertyAccessExpression(node.left) && node.left.expression.kind === tsInstance.SyntaxKind.ThisKeyword &&
            mappedProps[node.left.name.text.toString()]) {
                return factory.updateBinaryExpression(
                    node,
                    factory.updatePropertyAccessExpression(
                        node.left,
                        node.left.expression,
                        mappedProps[node.left.name.text.toString()]
                    ),
                    node.operatorToken,
                    node.right
                );
        } else if (tsInstance.isCallExpression(node) && node.expression.kind === tsInstance.SyntaxKind.SuperKeyword) {
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
                    hasInternalConstructor ? [] : node.parameters,
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
                                makeMethodValidators(
                                    state, classSymbol, false, classType.getConstructSignatures()[0],
                                    `Failed to construct '${classSymbol.name}'`, false),
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
                ...miscDeclarations.length === 0 ? [] : [factory.createPropertyDeclaration(
                    factory.createModifiersFromModifierFlags(tsInstance.ModifierFlags.Static),
                    declarationsName,
                    undefined,
                    undefined,
                    factory.createCommaListExpression(miscDeclarations)
                )]
            ]
        ),
        ...isInternalConstructor(metadata, classSymbol, config.treatMissingConstructorAsInternal, tsInstance, typeChecker) ?
            [idlFactory.createInternalSetMiscExpression(
                classSymbol,
                factory.createCallExpression(
                    idlFactory.createGlobalReference("Symbol"),
                    undefined,
                    []
                )
            )] : [],
        ...miscDeclarations.length === 0 ? [] : [factory.createExpressionStatement(
            factory.createDeleteExpression(
                factory.createPropertyAccessExpression(
                    factory.createIdentifier(classSymbol.name),
                    declarationsName
                )
            )
        )]
    ];
};