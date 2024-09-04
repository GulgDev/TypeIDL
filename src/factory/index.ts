import type ts from "typescript";
import { makeCreateFunctionApplyCall } from "./createFunctionApplyCall";
import { makeCreateMethodCall } from "./createMethodCall";
import { makeCreateInternalGetExpression } from "./createInternalGetExpression";
import { makeCreateInternalSetExpression } from "./createInternalSetExpression";
import { makeCreateInternalDeleteExpression } from "./createInternalDeleteExpression";
import { makeCreateInternalCallExpression } from "./createInternalCallExpression";
import { makeCreateInternalGetMiscExpression } from "./createInternalGetMiscExpression";
import { makeCreateInternalSetMiscExpression } from "./createInternalSetMiscExpression";
import { makeCreateInternalMarkExpression } from "./createInternalMarkExpression";
import { makeCreateInternalHasExpression } from "./createInternalHasExpression";
import { makeCreateIdentifier } from "./createIdentifier";
import { makeCreateGlobalReference } from "./createGlobalReference";
import { makeCreatePropertyReference } from "./createPropertyReference";
import { makeCreateReference } from "./createReference";
import { makeCreateInstancePropertyAccessorsReference } from "./createInstancePropertyAccessorsReference";
import { makeCreateInstanceMethodReference } from "./createInstanceMethodReference";

// @TODO: Pass getIDLFactory function

export interface IDLFactory {
    createFunctionApplyCall(target: ts.Expression, thisArg: ts.Expression, argumentsExpression?: ts.Expression): ts.CallExpression;
    createMethodCall(clazz: string, method: string, target: ts.Expression, argumentsList: readonly ts.Expression[]): ts.CallExpression;

    createInternalGetExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalSetExpression(expression: ts.Expression, symbol: ts.Symbol, value: ts.Expression): ts.Expression;
    createInternalDeleteExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalCallExpression(expression: ts.Expression, symbol: ts.Symbol, argumentsExpression: ts.Expression): ts.Expression;
    createInternalGetMiscExpression(symbol: ts.Symbol): ts.Expression;
    createInternalSetMiscExpression(symbol: ts.Symbol, value: ts.Expression): ts.Expression;
    createInternalMarkExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalHasExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;

    createIdentifier(name: string): ts.Identifier;

    createReference(symbol: ts.Symbol): ts.Identifier;
    createPropertyReference(parent: ts.Expression, name: string): ts.Identifier;
    createGlobalReference(name: string): ts.Identifier;

    createInstancePropertyAccessorsReference(parent: ts.Expression, name: string): [ts.Identifier, ts.Identifier];
    createInstanceMethodReference(parent: ts.Expression, name: string): ts.Identifier;
}

export const makeFactory =
    (
        internals: ts.Identifier,
        initializers: ts.Statement[],
        references: Map<ts.Expression, { [key: string]: ts.Identifier }>,
        instancePropertyReferences: Map<ts.Expression, { [key: string]: [ts.Identifier, ts.Identifier] }>,
        instanceMethodReferences: Map<ts.Expression, { [key: string]: ts.Identifier }>,
        identifiers: { [key: string]: ts.Identifier },
        tsInstance: typeof ts,
        typeChecker: ts.TypeChecker,
        factory: ts.NodeFactory,
        trustGlobals: boolean
    ): IDLFactory => ({
        createFunctionApplyCall: trustGlobals ?
            (target, thisArg, argumentsExpression = factory.createArrayLiteralExpression()) =>
                factory.createFunctionApplyCall(target, thisArg, argumentsExpression) :
            makeCreateFunctionApplyCall(internals, factory),
        createMethodCall: trustGlobals ?
            (_clazz, method, target, argumentsList) =>
                factory.createMethodCall(target, method, argumentsList) :
            makeCreateMethodCall(internals, initializers, references, instanceMethodReferences, identifiers, tsInstance, factory),

        createInternalGetExpression: makeCreateInternalGetExpression(internals, tsInstance, factory),
        createInternalSetExpression: makeCreateInternalSetExpression(internals, tsInstance, factory),
        createInternalDeleteExpression: makeCreateInternalDeleteExpression(internals, tsInstance, factory),
        createInternalCallExpression: makeCreateInternalCallExpression(internals, tsInstance, factory),
        createInternalGetMiscExpression: makeCreateInternalGetMiscExpression(internals, tsInstance, factory),
        createInternalSetMiscExpression: makeCreateInternalSetMiscExpression(internals, tsInstance, factory),
        createInternalMarkExpression: makeCreateInternalMarkExpression(internals, tsInstance, factory),
        createInternalHasExpression: makeCreateInternalHasExpression(internals, tsInstance, factory),

        createIdentifier: makeCreateIdentifier(identifiers, factory),

        createReference: trustGlobals ?
            (symbol: ts.Symbol) => factory.createIdentifier(symbol.name) :
            makeCreateReference(references, identifiers, tsInstance, typeChecker, factory),
        createPropertyReference: makeCreatePropertyReference(references, factory),
        createGlobalReference: trustGlobals ? factory.createIdentifier : makeCreateGlobalReference(references, identifiers, factory),

        createInstancePropertyAccessorsReference:
            makeCreateInstancePropertyAccessorsReference(initializers, instancePropertyReferences, tsInstance, factory),
        createInstanceMethodReference:
            makeCreateInstanceMethodReference(initializers, instanceMethodReferences, tsInstance, factory)
    });