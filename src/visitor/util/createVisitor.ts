import type ts from "typescript";
import type { Visitor, Visitors } from ".";
import visitEachChild from "./visitEachChild";

export default function createVisitor(tsInstance: typeof ts, visitors: Visitors, context: ts.TransformationContext): Visitor {
    const visitor: Visitor<any> = (hint, node) =>
        (visitors[node.kind as keyof Visitors] ?? visitors["default"] ?? defaultVisitor)(hint, node);

    const defaultVisitor: Visitor = (_hint, node) => visitEachChild(tsInstance, node, visitor, context);

    return visitor;
}