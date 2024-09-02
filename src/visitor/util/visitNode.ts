import type ts from "typescript";
import { type Visitor, wrap } from ".";

export default function visitNode<T extends ts.Node>(tsInstance: typeof ts, node: T, visitor: Visitor) {
    return tsInstance.visitNode(node, wrap(visitor));
}