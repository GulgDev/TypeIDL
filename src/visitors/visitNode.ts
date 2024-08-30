import type ts from "typescript";
import type { State } from "..";
import { visitClassDeclaration } from "./visitClassDeclaration";
import { visitPropertyAccessExpression } from "./visitPropertyAccessExpression";
import { visitBinaryExpression } from "./visitBinaryExpression";
import { visitDeleteExpression } from "./visitDeleteExpression";
import { visitCallExpression } from "./visitCallExpression";
import { visitNewExpression } from "./visitNewExpression";

export const visitNode = (state: State) => (node: ts.Node): ts.Node | ts.Node[] => {
    const { tsInstance, ctx } = state;

    if (tsInstance.isClassDeclaration(node))
        return visitClassDeclaration(state)(node);
    else if (tsInstance.isPropertyAccessExpression(node))
        return visitPropertyAccessExpression(state)(node);
    else if (tsInstance.isBinaryExpression(node))
        return visitBinaryExpression(state)(node);
    else if (tsInstance.isDeleteExpression(node))
        return visitDeleteExpression(state)(node);
    else if (tsInstance.isCallExpression(node))
        return visitCallExpression(state)(node);
    else if (tsInstance.isNewExpression(node))
        return visitNewExpression(state)(node);

    return tsInstance.visitEachChild(node, visitNode(state), ctx);
};