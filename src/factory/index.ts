import type ts from "typescript";
import type { MetadataManager } from "../metadata";
import { makeCreateInternalGetExpression } from "./createInternalGetExpression";
import { makeCreateInternalSetExpression } from "./createInternalSetExpression";
import { makeCreateInternalDeleteExpression } from "./createInternalDeleteExpression";
import { makeCreateInternalCallExpression } from "./createInternalCallExpression";
import { makeCreateInternalGetMiscExpression } from "./createInternalGetMiscExpression";
import { makeCreateInternalSetMiscExpression } from "./createInternalSetMiscExpression";
import { makeCreateInternalMarkExpression } from "./createInternalMarkExpression";
import { makeCreateInternalHasExpression } from "./createInternalHasExpression";

export interface IDLFactory {
    createInternalGetExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalSetExpression(expression: ts.Expression, symbol: ts.Symbol, value: ts.Expression): ts.Expression;
    createInternalDeleteExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalCallExpression(expression: ts.Expression, symbol: ts.Symbol, args: ts.NodeArray<ts.Expression>): ts.Expression;
    createInternalGetMiscExpression(symbol: ts.Symbol): ts.Expression;
    createInternalSetMiscExpression(symbol: ts.Symbol, value: ts.Expression): ts.Expression;
    createInternalMarkExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
    createInternalHasExpression(expression: ts.Expression, symbol: ts.Symbol): ts.Expression;
}

export const makeFactory = (internals: ts.Identifier, factory: ts.NodeFactory, metadata: MetadataManager): IDLFactory => (
    {
        createInternalGetExpression: makeCreateInternalGetExpression(internals, factory, metadata),
        createInternalSetExpression: makeCreateInternalSetExpression(internals, factory, metadata),
        createInternalDeleteExpression: makeCreateInternalDeleteExpression(internals, factory, metadata),
        createInternalCallExpression: makeCreateInternalCallExpression(internals, factory, metadata),
        createInternalGetMiscExpression: makeCreateInternalGetMiscExpression(internals, factory, metadata),
        createInternalSetMiscExpression: makeCreateInternalSetMiscExpression(internals, factory, metadata),
        createInternalMarkExpression: makeCreateInternalMarkExpression(internals, factory, metadata),
        createInternalHasExpression: makeCreateInternalHasExpression(internals, factory, metadata)
    }
);