import type ts from "typescript";
import { makeCreatePropertyReference } from "./createPropertyReference";
import { makeCreateIdentifier } from "./createIdentifier";

export const makeCreateGlobalReference =
    (references: Map<ts.Expression, { [key: string]: ts.Identifier }>, identifiers: { [key: string]: ts.Identifier }, factory: ts.NodeFactory) =>
    (name: string): ts.Identifier =>
        makeCreatePropertyReference(references, factory)(
            makeCreateIdentifier(identifiers, factory)("globalThis"),
            name
        );