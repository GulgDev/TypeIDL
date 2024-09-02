import type ts from "typescript";
import type { State } from "..";
import { TypeMatcher } from "../typeMatcher";
import simplifyType from "../util/simplifyType";
import makeConverter from ".";

export default function makeUnionConverter(state: State, type: ts.UnionType): ts.Statement[] {
    const { tsInstance, typeChecker, factory, idlFactory } = state;

    const result: ts.Statement[] = [];

    const typeMatcher = new TypeMatcher(tsInstance, typeChecker);

    const types = type.types.map((type) => simplifyType(state, type));

    if (types.find((member) => typeMatcher.isUndefinedType(member)))
        result.push(
            factory.createIfStatement(
                factory.createStrictEquality(
                    factory.createIdentifier("value"),
                    factory.createVoidZero()
                ),
                factory.createReturnStatement(
                    factory.createVoidZero()
                )
            )
        );

    if (types.find((member) => typeMatcher.isNullType(member)))
        result.push(
            factory.createIfStatement(
                factory.createEquality(
                    factory.createIdentifier("value"),
                    factory.createNull()
                ),
                factory.createReturnStatement(
                    factory.createNull()
                )
            )
        );
    
    const classTypes = types.filter((member) => typeMatcher.isClassType(member));
    result.push(
        ...classTypes.map((classType) =>
            factory.createIfStatement(
                type.symbol.declarations &&
                !!type.symbol.declarations.find((declaration) => tsInstance.isClassDeclaration(declaration)) ?
                    idlFactory.createInternalHasExpression(
                        factory.createIdentifier("value"),
                        classType.symbol
                    ) :
                    factory.createBinaryExpression(
                        factory.createIdentifier("value"),
                        tsInstance.SyntaxKind.InstanceOfKeyword,
                        idlFactory.createReference(type.symbol)
                    ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        )
    );

    const classTypeTypes = types.filter((member) => typeMatcher.isClassTypeType(member));
    result.push(
        ...classTypeTypes.map((classTypeType) =>
            factory.createIfStatement(
                factory.createLogicalOr(
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
                            idlFactory.createReference(classTypeType.symbol),
                            factory.createIdentifier("value")
                        ]
                    ),
                    factory.createStrictEquality(
                        factory.createIdentifier("value"),
                        idlFactory.createReference(classTypeType.symbol)
                    )
                ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        )
    );
    
    const interfaceType = types.find((member) => typeMatcher.isInterfaceType(member));
    if (interfaceType)
        result.push(
            factory.createIfStatement(
                factory.createEquality(
                    factory.createIdentifier("value"),
                    factory.createNull()
                ),
                factory.createReturnStatement(
                    factory.createCallExpression(
                        makeConverter(state, interfaceType),
                        undefined,
                        [
                            factory.createIdentifier("value"),
                            factory.createIdentifier("cache")
                        ]
                    )
                )
            )
        );
    
    const functionType = types.find((member) => typeMatcher.isFunctionType(member));
    if (functionType)
        result.push(
            factory.createIfStatement(
                factory.createStrictEquality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("function")
                ),
                factory.createReturnStatement(
                    factory.createCallExpression(
                        makeConverter(state, functionType),
                        undefined,
                        [
                            factory.createIdentifier("value"),
                            factory.createIdentifier("cache")
                        ]
                    )
                )
            )
        );
    
    const objectType = types.find((member) => typeMatcher.isObjectType(member));

    if (objectType)
        result.push(
            factory.createIfStatement(
                factory.createStrictEquality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("function")
                ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        );
    
    if (interfaceType)
        result.push(
            factory.createIfStatement(
                factory.createLogicalAnd(
                    factory.createStrictInequality(
                        factory.createIdentifier("value"),
                        factory.createNull()
                    ),
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
                    )
                ),
                factory.createReturnStatement(
                    factory.createCallExpression(
                        makeConverter(state, interfaceType),
                        undefined,
                        [
                            factory.createIdentifier("value"),
                            factory.createIdentifier("cache")
                        ]
                    )
                )
            )
        );
    
    if (objectType)
        result.push(
            factory.createIfStatement(
                factory.createLogicalAnd(
                    factory.createStrictInequality(
                        factory.createIdentifier("value"),
                        factory.createNull()
                    ),
                    factory.createStrictEquality(
                        factory.createTypeOfExpression(
                            factory.createIdentifier("value")
                        ),
                        factory.createStringLiteral("object")
                    )
                ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        );

    if (types.find((member) => typeMatcher.isSymbolType(member)))
        result.push(
            factory.createIfStatement(
                factory.createStrictEquality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("symbol")
                ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        );
    
    const booleanType = types.find((member) => typeMatcher.isBooleanType(member));
    if (booleanType)
        result.push(
            factory.createIfStatement(
                factory.createStrictEquality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("boolean")
                ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        );
    
    const numberType = types.find((member) => typeMatcher.isNumberType(member));
    if (numberType)
        result.push(
            factory.createIfStatement(
                factory.createStrictEquality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("number")
                ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        );
    
    const bigIntType = types.find((member) => typeMatcher.isBigIntType(member));
    if (bigIntType)
        result.push(
            factory.createIfStatement(
                factory.createStrictEquality(
                    factory.createTypeOfExpression(
                        factory.createIdentifier("value")
                    ),
                    factory.createStringLiteral("bigint")
                ),
                factory.createReturnStatement(
                    factory.createIdentifier("value")
                )
            )
        );
    
    if (types.find((member) => typeMatcher.isStringType(member)))
        result.push(
            factory.createReturnStatement(
                factory.createCallExpression(
                    idlFactory.createGlobalReference("String"),
                    undefined,
                    [factory.createIdentifier("value")]
                )
            )
        );
    else if (numberType)
        result.push(
            factory.createReturnStatement(
                factory.createCallExpression(
                    idlFactory.createGlobalReference("Number"),
                    undefined,
                    [factory.createIdentifier("value")]
                )
            )
        );
    else if (booleanType)
        result.push(
            factory.createReturnStatement(
                factory.createCallExpression(
                    idlFactory.createGlobalReference("Boolean"),
                    undefined,
                    [factory.createIdentifier("value")]
                )
            )
        );
    else if (bigIntType)
        result.push(
            factory.createReturnStatement(
                factory.createCallExpression(
                    idlFactory.createGlobalReference("BigInt"),
                    undefined,
                    [factory.createIdentifier("value")]
                )
            )
        );
    else
        result.push(
            factory.createThrowStatement(
                factory.createNewExpression(
                    idlFactory.createGlobalReference("TypeError"),
                    undefined,
                    [factory.createIdentifier("errorMessage")]
                )
            )
        );

    return result;
}