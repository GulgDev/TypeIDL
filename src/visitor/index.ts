import type { State } from "..";
import type { Visitor, Visitors } from "./util";
import createVisitor from "./util/createVisitor";
import { visitClassDeclaration } from "./visitClassDeclaration";
import { visitPropertyAccessExpression } from "./visitPropertyAccessExpression";
import { visitIdentifier } from "./visitIdentifier";
import { visitBinaryExpression } from "./visitBinaryExpression";
import { visitDeleteExpression } from "./visitDeleteExpression";
import { visitCallExpression } from "./visitCallExpression";
import { visitNewExpression } from "./visitNewExpression";

export default function makeVisitor(state: State): Visitor {
    const { tsInstance } = state;

    let visitor: Visitor;

    const visitNode: Visitor = (hint, node) => visitor(hint, node);

    const visitors: Visitors = {
        [tsInstance.SyntaxKind.ClassDeclaration]: visitClassDeclaration(state, visitNode),
        [tsInstance.SyntaxKind.PropertyAccessExpression]: visitPropertyAccessExpression(state, visitNode),
        [tsInstance.SyntaxKind.Identifier]: visitIdentifier(state),
        [tsInstance.SyntaxKind.BinaryExpression]: visitBinaryExpression(state, visitNode),
        [tsInstance.SyntaxKind.DeleteExpression]: visitDeleteExpression(state, visitNode),
        [tsInstance.SyntaxKind.CallExpression]: visitCallExpression(state, visitNode),
        [tsInstance.SyntaxKind.NewExpression]: visitNewExpression(state, visitNode)
    };

    return visitor = createVisitor(state.tsInstance, visitors, state.ctx);
}