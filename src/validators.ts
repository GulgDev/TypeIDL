import type ts from "typescript";
import { State } from ".";
import makeConverter from "./converters";
import stringifyType from "./util/stringifyType";

export default function makeMethodValidators(
    state: State, classSymbol: ts.Symbol, isStatic: boolean, signature: ts.Signature, errorMessage: string, needsThisCheck: boolean = true
): ts.Statement[] {
    const { typeChecker, factory, idlFactory } = state;

    const result: ts.Statement[] = [];

    if (signature.thisParameter) {
        needsThisCheck = false;
        
        result.push(
            factory.createIfStatement(
                factory.createLogicalNot(
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            factory.createIdentifier("Object"),
                            "is"
                        ),
                        undefined,
                        [
                            factory.createImmediatelyInvokedArrowFunction(
                                [factory.createTryStatement(
                                    factory.createBlock([
                                        factory.createReturnStatement(
                                            factory.createCallExpression(
                                                makeConverter(state, typeChecker.getTypeOfSymbol(signature.thisParameter)),
                                                undefined,
                                                [factory.createThis()]
                                            )
                                        )
                                    ]),
                                    factory.createCatchClause(
                                        undefined,
                                        factory.createBlock([
                                            factory.createReturnStatement(
                                                factory.createObjectLiteralExpression()
                                            )
                                        ])
                                    ),
                                    undefined
                                )]
                            ),
                            factory.createThis()
                        ]
                    )
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        factory.createIdentifier("TypeError"),
                        undefined,
                        [factory.createStringLiteral("Illegal invocation")]
                    )
                )
            )
        );
    }
    
    if (needsThisCheck)
        result.push(
            factory.createIfStatement(
                isStatic ?
                    factory.createLogicalAnd(
                        factory.createLogicalNot(
                            factory.createCallExpression(
                                factory.createPropertyAccessExpression(
                                    factory.createPropertyAccessExpression(
                                        factory.createIdentifier("Object"),
                                        "isPrototypeOf"
                                    ),
                                    "call"
                                ),
                                undefined,
                                [
                                    factory.createIdentifier(classSymbol.name),
                                    factory.createThis()
                                ]
                            )
                        ),
                        factory.createStrictInequality(
                            factory.createThis(),
                            factory.createIdentifier(classSymbol.name)
                        )
                    ) : factory.createLogicalNot(
                        idlFactory.createInternalHasExpression(
                            factory.createThis(),
                            classSymbol
                        )
                    ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        factory.createIdentifier("TypeError"),
                        undefined,
                        [factory.createStringLiteral("Illegal invocation")]
                    )
                )
            )
        );
    
    result.push(
        factory.createIfStatement(
            factory.createLessThan(
                factory.createPropertyAccessExpression(
                    factory.createIdentifier("arguments"),
                    "length"
                ),
                factory.createNumericLiteral(signature.minArgumentCount)
            ),
            factory.createThrowStatement(
                factory.createNewExpression(
                    factory.createIdentifier("TypeError"),
                    undefined,
                    [
                        factory.createAdd(
                            factory.createAdd(
                                factory.createStringLiteral(
                                    `${errorMessage}: ${
                                        signature.minArgumentCount
                                    } argument${
                                        signature.minArgumentCount.toString().endsWith("1") ? "" : "s"
                                    } required, but only `
                                ),
                                factory.createPropertyAccessExpression(
                                    factory.createIdentifier("arguments"),
                                    "length"
                                )
                            ),
                            factory.createStringLiteral(" present.")
                        )
                    ]
                )
            )
        )
    );
    
    result.push(
        factory.createTryStatement(
            factory.createBlock(
                signature.parameters
                    .map((parameter, i) => {
                        const type = typeChecker.getTypeOfSymbol(parameter);
                        return factory.createExpressionStatement(
                            factory.createAssignment(
                                factory.createIdentifier(parameter.name),
                                factory.createCallExpression(
                                    makeConverter(state, type),
                                    undefined,
                                    [
                                        factory.createIdentifier(parameter.name),
                                        factory.createStringLiteral(`parameter ${i + 1} is not of type '${stringifyType(state, type)}'.`)
                                    ]
                                )
                            )
                        );
                    }),
                true
            ),
            factory.createCatchClause(
                "error",
                factory.createBlock(
                    [factory.createThrowStatement(
                        factory.createNewExpression(
                            factory.createIdentifier("TypeError"),
                            undefined,
                            [
                                factory.createAdd(
                                    factory.createStringLiteral(errorMessage + ": "),
                                    factory.createPropertyAccessExpression(
                                        factory.createIdentifier("error"),
                                        "message"
                                    )
                                )
                            ]
                        )
                    )],
                    false
                )
            ),
            undefined
        )
    );
    return result;
}