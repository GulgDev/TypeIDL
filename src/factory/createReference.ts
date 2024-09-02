import type ts from "typescript";
import type { MetadataManager } from "../metadata";
import { isGlobal } from "../util/isGlobal";
import { makeCreateGlobalReference } from "./createGlobalReference";

export const makeCreateReference =
    (
        references: Map<ts.Expression, { [key: string]: ts.Identifier }>,
        identifiers: { [key: string]: ts.Identifier },
        tsInstance: typeof ts,
        typeChecker: ts.TypeChecker,
        factory: ts.NodeFactory,
        metadata: MetadataManager
    ) =>
    (symbol: ts.Symbol): ts.Identifier =>
        (isGlobal(metadata, symbol, tsInstance, typeChecker) ?
            makeCreateGlobalReference(references, identifiers, factory) :
            factory.createIdentifier)(symbol.name);