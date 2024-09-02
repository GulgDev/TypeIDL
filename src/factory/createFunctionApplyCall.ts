import type ts from "typescript";

export const makeCreateFunctionApplyCall =
    (internals: ts.Identifier, factory: ts.NodeFactory) =>
    (target: ts.Expression, thisArg: ts.Expression, argumentsExpression?: ts.Expression): ts.CallExpression =>
        factory.createCallExpression(
            factory.createPropertyAccessExpression(internals, "apply"),
            undefined,
            argumentsExpression ? [target, thisArg, argumentsExpression] : [target, thisArg]
        );