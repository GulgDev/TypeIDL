import type ts from "typescript";
import { State } from ".";
import makeConverter from "./converters";
import stringifyType from "./util/stringifyType";

export default function makeMethodValidators(
    state: State, classSymbol: ts.Symbol, isStatic: boolean, signature: ts.Signature, errorMessage: string
): ts.Statement[] {
    const { typeChecker, factory, idlFactory } = state;

    const result: ts.Statement[] = [];

    let needsThisCheck = !isStatic;

    if (signature.thisParameter) {
        needsThisCheck = false;
        
        result.push(
            factory.createIfStatement(
                factory.createLogicalNot(
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            idlFactory.createGlobalReference("Object"),
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
                        idlFactory.createGlobalReference("TypeError"),
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
                factory.createLogicalNot(
                    idlFactory.createInternalHasExpression(
                        factory.createThis(),
                        classSymbol
                    )
                ),
                factory.createThrowStatement(
                    factory.createNewExpression(
                        idlFactory.createGlobalReference("TypeError"),
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
                    idlFactory.createGlobalReference("TypeError"),
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
                    .map((parameter, index) => {
                        const type = typeChecker.getTypeOfSymbol(parameter);
                        return factory.createExpressionStatement(
                            factory.createAssignment(
                                factory.createIdentifier("arg" + index),
                                factory.createCallExpression(
                                    makeConverter(state, type),
                                    undefined,
                                    [
                                        factory.createIdentifier("arg" + index),
                                        factory.createStringLiteral(`parameter ${index + 1} is not of type '${stringifyType(state, type)}'.`)
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
                            idlFactory.createGlobalReference("TypeError"),
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