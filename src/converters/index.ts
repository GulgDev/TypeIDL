import type ts from "typescript";
import type { State } from "..";
import { TypeMatcher } from "../typeMatcher";
import simplifyType from "../util/simplifyType";
import makeUnionConverter from "./union";
import makeInterfaceConverter from "./interface";
import makeArrayConverter from "./array";

function makeConverterUnwrapped(state: State, type: ts.Type): ts.Statement[] {
    const { tsInstance, typeChecker, factory, idlFactory } = state;

    const typeMatcher = new TypeMatcher(tsInstance, typeChecker);
    if (typeMatcher.isUndefinedType(type)) {
        return [
            factory.createIfStatement(
                factory.createStrictInequality(
                    factory.createIdentifier("value"),
                    factory.createVoidZero()
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isNullType(type)) {
        return [
            factory.createIfStatement(
                factory.createInequality(
                    factory.createIdentifier("value"),
                    factory.createNull()
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (type.isStringLiteral()) {
        return [
            factory.createIfStatement(
                factory.createStrictInequality(
                    factory.createIdentifier("value"),
                    factory.createStringLiteral(type.value)
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (type.isNumberLiteral()) {
        return [
            factory.createIfStatement(
                factory.createStrictInequality(
                    factory.createIdentifier("value"),
                    factory.createNumericLiteral(type.value)
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isBigIntLiteralType(type)) {
        return [
            factory.createIfStatement(
                factory.createStrictInequality(
                    factory.createIdentifier("value"),
                    factory.createBigIntLiteral(type.value)
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isBooleanLiteralType(type)) {
        return [
            factory.createIfStatement(
                factory.createStrictInequality(
                    factory.createIdentifier("value"),
                    type.intrinsicName === "true" ?
                        factory.createTrue() :
                        factory.createFalse()
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isClassTypeType(type)) {
        return [
            factory.createIfStatement(
                factory.createLogicalAnd(
                    factory.createLogicalNot(
                        factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                                factory.createPropertyAccessExpression(
                                    idlFactory.createGlobalReference("Object"),
                                    "isPrototypeOf"
                                ),
                                "call"
                            ),
                            undefined,
                            [
                                idlFactory.createReference(type.symbol),
                                factory.createIdentifier("value")
                            ]
                        )
                    ),
                    factory.createStrictInequality(
                        factory.createIdentifier("value"),
                        idlFactory.createReference(type.symbol)
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
        ];
    } else if (typeMatcher.isFunctionType(type)) {
        return [
            factory.createIfStatement(
                factory.createStrictInequality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("function")
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (type.isClassOrInterface()) {
        return type.objectFlags & tsInstance.ObjectFlags.Reference ?
            [
                factory.createIfStatement(
                    factory.createLogicalNot(
                        type.symbol.declarations &&
                        !!type.symbol.declarations.find((declaration) => tsInstance.isClassDeclaration(declaration)) ?
                            idlFactory.createInternalHasExpression(
                                factory.createIdentifier("value"),
                                type.symbol
                            ) :
                            factory.createBinaryExpression(
                                factory.createIdentifier("value"),
                                tsInstance.SyntaxKind.InstanceOfKeyword,
                                idlFactory.createReference(type.symbol)
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
            ] :
            makeInterfaceConverter(state, type);
    } else if (typeChecker.isArrayType(type)) {
        return makeArrayConverter(state, type);
    } else if (typeMatcher.isSymbolType(type)) {
        return [
            factory.createIfStatement(
                factory.createStrictInequality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("symbol")
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
                        undefined,
                        [factory.createIdentifier("errorMessage")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isBooleanType(type)) {
        return [
            factory.createExpressionStatement(
                factory.createAssignment(
                    factory.createIdentifier("value"),
                    factory.createCallExpression(
                        idlFactory.createGlobalReference("Boolean"),
                        undefined,
                        [factory.createIdentifier("value")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isNumberType(type)) {
        return [
            factory.createExpressionStatement(
                factory.createAssignment(
                    factory.createIdentifier("value"),
                    factory.createCallExpression(
                        idlFactory.createGlobalReference("Number"),
                        undefined,
                        [factory.createIdentifier("value")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isBigIntType(type)) {
        return [
            factory.createExpressionStatement(
                factory.createAssignment(
                    factory.createIdentifier("value"),
                    factory.createCallExpression(
                        idlFactory.createGlobalReference("BigInt"),
                        undefined,
                        [factory.createIdentifier("value")]
                    )
                )
            )
        ];
    } else if (typeMatcher.isStringType(type)) {
        return [
            factory.createExpressionStatement(
                factory.createAssignment(
                    factory.createIdentifier("value"),
                    factory.createCallExpression(
                        idlFactory.createGlobalReference("String"),
                        undefined,
                        [factory.createIdentifier("value")]
                    )
                )
            )
        ];
    } else if (type.isUnion()) {
        return makeUnionConverter(state, type);
    } else {
        return [];
    }
}

export default function makeConverter(state: State, type: ts.Type): ts.Expression {
    const { tsInstance, typeChecker, factory, idlFactory } = state;

    type = simplifyType(state, type);

    const existingConverter = state.typeConverters.get(type);
    if (existingConverter)
        return existingConverter;

    const name = factory.createUniqueName("converter");
    state.typeConverters.set(type, name);
    state.initializers.push(
        factory.createFunctionDeclaration(
            undefined,
            undefined,
            name,
            undefined,
            [
                factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    "value",
                    undefined,
                    factory.createKeywordTypeNode(tsInstance.SyntaxKind.AnyKeyword)
                ),
                factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    "errorMessage",
                    undefined,
                    factory.createKeywordTypeNode(tsInstance.SyntaxKind.StringKeyword)
                ),
                factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    "cache",
                    undefined,
                    factory.createKeywordTypeNode(tsInstance.SyntaxKind.AnyKeyword),
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("WeakMap"),
                        undefined,
                        []
                    )
                )
            ],
            typeChecker.typeToTypeNode(type, undefined, undefined),
            factory.createBlock([
                ...makeConverterUnwrapped(state, type),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            ], true)
        )
    );
    return name;
}