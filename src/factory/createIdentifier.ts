import type ts from "typescript";

export const makeCreateIdentifier =
    (identifiers: { [key: string]: ts.Identifier }, factory: ts.NodeFactory) =>
    (name: string): ts.Identifier =>
        identifiers[name] ?? (identifiers[name] = factory.createIdentifier(name));