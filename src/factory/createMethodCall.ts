import type ts from "typescript";
import { makeCreateFunctionApplyCall } from "./createFunctionApplyCall";
import { makeCreateInstanceMethodReference } from "./createInstanceMethodReference";
import { makeCreateGlobalReference } from "./createGlobalReference";

export const makeCreateMethodCall =
    (
        internals: ts.Identifier,
        initializers: ts.Statement[],
        references: Map<ts.Expression, { [key: string]: ts.Identifier }>,
        instanceMethodReferences: Map<ts.Expression, { [key: string]: ts.Identifier }>,
        identifiers: { [key: string]: ts.Identifier },
        tsInstance: typeof ts,
        factory: ts.NodeFactory
    ) =>
    (clazz: string, method: string, target: ts.Expression, argumentsList: readonly ts.Expression[]): ts.CallExpression =>
        makeCreateFunctionApplyCall(internals, factory)(
            makeCreateInstanceMethodReference(initializers, instanceMethodReferences, tsInstance, factory)(
                makeCreateGlobalReference(references, identifiers, factory)(clazz),
                method
            ),
            target,
            factory.createArrayLiteralExpression(argumentsList)
        );