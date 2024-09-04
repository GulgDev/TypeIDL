import type ts from "typescript";
import { isGlobal } from "../util/isGlobal";
import { makeCreateGlobalReference } from "./createGlobalReference";

export const makeCreateReference =
    (
        references: Map<ts.Expression, { [key: string]: ts.Identifier }>,
        identifiers: { [key: string]: ts.Identifier },
        tsInstance: typeof ts,
        typeChecker: ts.TypeChecker,
        factory: ts.NodeFactory
    ) =>
    (symbol: ts.Symbol): ts.Identifier =>
        (isGlobal(symbol, tsInstance, typeChecker) ?
            makeCreateGlobalReference(references, identifiers, factory) :
            factory.createIdentifier)(symbol.name);