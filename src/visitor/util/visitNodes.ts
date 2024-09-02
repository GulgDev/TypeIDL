import type ts from "typescript";
import { type Visitor, wrap } from ".";

export default function visitNodes<T extends ts.Node, TArray extends ts.NodeArray<T> | undefined>(
    tsInstance: typeof ts,
    nodes: TArray,
    visitor: Visitor,
    start?: number
):  ts.NodeArray<ts.Node> | (TArray & undefined) {
    return tsInstance.visitNodes(nodes, wrap(visitor), () => true, start);
}