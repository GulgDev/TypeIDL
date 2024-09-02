import type ts from "typescript";

export const makeCreatePropertyReference =
    (references: Map<ts.Expression, { [key: string]: ts.Identifier }>, factory: ts.NodeFactory) =>
    (parent: ts.Expression, name: string): ts.Identifier => {
        let propertyReferences = references.get(parent);
        if (!propertyReferences) {
            propertyReferences = {};
            references.set(parent, propertyReferences);
        }
        return propertyReferences[name] ?? (propertyReferences[name] = factory.createUniqueName(name));
    };