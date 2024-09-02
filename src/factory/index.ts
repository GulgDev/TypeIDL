import type ts from "typescript";
import type { MetadataManager } from "../metadata";
import { makeCreateFunctionApplyCall } from "./createFunctionApplyCall";
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

export interface IDLFactory {
    createFunctionApplyCall(target: ts.Expression, thisArg: ts.Expression, argumentsExpression?: ts.Expression): ts.CallExpression;

    createInternalGetExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalSetExpression(expression: ts.Expression, symbol: ts.Symbol, value: ts.Expression): ts.Expression;
    createInternalDeleteExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalCallExpression(expression: ts.Expression, symbol: ts.Symbol, args: ts.NodeArray<ts.Expression>): ts.Expression;
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
        metadata: MetadataManager,
        trustGlobals: boolean
    ): IDLFactory => ({
        createFunctionApplyCall: trustGlobals ?
            (target, thisArg, argumentsExpression = factory.createArrayLiteralExpression()) =>
                factory.createFunctionApplyCall(target, thisArg, argumentsExpression) :
            makeCreateFunctionApplyCall(internals, factory),

        createInternalGetExpression: makeCreateInternalGetExpression(internals, factory, metadata),
        createInternalSetExpression: makeCreateInternalSetExpression(internals, factory, metadata),
        createInternalDeleteExpression: makeCreateInternalDeleteExpression(internals, factory, metadata),
        createInternalCallExpression: makeCreateInternalCallExpression(internals, factory, metadata),
        createInternalGetMiscExpression: makeCreateInternalGetMiscExpression(internals, factory, metadata),
        createInternalSetMiscExpression: makeCreateInternalSetMiscExpression(internals, factory, metadata),
        createInternalMarkExpression: makeCreateInternalMarkExpression(internals, factory, metadata),
        createInternalHasExpression: makeCreateInternalHasExpression(internals, factory, metadata),

        createIdentifier: makeCreateIdentifier(identifiers, factory),

        createReference: trustGlobals ?
            (symbol: ts.Symbol) => factory.createIdentifier(symbol.name) :
            makeCreateReference(references, identifiers, tsInstance, typeChecker, factory, metadata),
        createPropertyReference: makeCreatePropertyReference(references, factory),
        createGlobalReference: trustGlobals ? factory.createIdentifier : makeCreateGlobalReference(references, identifiers, factory),

        createInstancePropertyAccessorsReference:
            makeCreateInstancePropertyAccessorsReference(initializers, instancePropertyReferences, tsInstance, factory),
        createInstanceMethodReference:
            makeCreateInstanceMethodReference(initializers, instanceMethodReferences, tsInstance, factory)
    });