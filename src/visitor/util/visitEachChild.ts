import type ts from "typescript";
import { type Visitor, VisitHint, wrap } from ".";

export default function visitEachChild<T extends ts.Node>(tsInstance: typeof ts, node: T, visitor: Visitor, context: ts.TransformationContext): T {
    const {
        isArrayBindingElement, isArrayBindingPattern, isArrayLiteralExpression, isArrayTypeNode,
        isArrowFunction, isAsExpression, isAssertClause, isAssertsKeyword, isAwaitExpression,
        isBinaryExpression, isBindingElement, isBindingName, isBlock, isBreakStatement, isCallChain,
        isCallExpression, isCallSignatureDeclaration, isCaseBlock, isCaseClause, isCaseOrDefaultClause,
        isCatchClause, isClassDeclaration, isClassElement, isClassExpression, isClassStaticBlockDeclaration,
        isCommaListExpression, isComputedPropertyName, isConditionalExpression, isConditionalTypeNode,
        isConstructSignatureDeclaration, isConstructorDeclaration, isConstructorTypeNode, isContinueStatement,
        isDecorator, isDefaultClause, isDeleteExpression, isDoStatement, isElementAccessChain, isElementAccessExpression,
        isEntityName, isEnumDeclaration, isEnumMember, isExportAssignment, isExportDeclaration, isExportSpecifier,
        isExpression, isExpressionStatement, isExpressionWithTypeArguments, isExternalModuleReference, isForInStatement,
        isForInitializer, isForOfStatement, isForStatement, isFunctionDeclaration, isFunctionExpression, isFunctionTypeNode,
        isGetAccessorDeclaration, isHeritageClause, isIdentifier, isIdentifierOrThisTypeNode, isIfStatement, isImportAttribute,
        isImportAttributeName, isImportAttributes, isImportClause, isImportDeclaration, isImportEqualsDeclaration,
        isImportSpecifier, isImportTypeAssertionContainer, isImportTypeNode, isIndexSignatureDeclaration, isIndexedAccessTypeNode,
        isInferTypeNode, isInterfaceDeclaration, isIntersectionTypeNode, isJsxAttribute, isJsxAttributeLike, isJsxAttributeName,
        isJsxAttributes, isJsxChild, isJsxClosingElement, isJsxClosingFragment, isJsxElement, isJsxExpression, isJsxFragment,
        isJsxNamespacedName, isJsxOpeningElement, isJsxOpeningFragment, isJsxSelfClosingElement, isJsxSpreadAttribute, isJsxTagNameExpression,
        isLabeledStatement, isLiteralTypeLiteral, isLiteralTypeNode, isMappedTypeNode, isMemberName, isMetaProperty, isMethodDeclaration,
        isMethodSignature, isModifier, isModifierLike, isModuleBlock, isModuleBody, isModuleDeclaration, isModuleName, isModuleReference,
        isNamedExportBindings, isNamedExports, isNamedImportBindings, isNamedImports, isNamedTupleMember, isNamespaceExport,
        isNamespaceExportDeclaration, isNamespaceImport, isNewExpression, isNonNullExpression, isObjectBindingPattern, isObjectLiteralElementLike,
        isObjectLiteralExpression, isOptionalChain, isOptionalTypeNode, isParameter, isParenthesizedExpression, isParenthesizedTypeNode,
        isPartiallyEmittedExpression, isPostfixUnaryExpression, isPrefixUnaryExpression, isPropertyAccessChain, isPropertyAccessExpression,
        isPropertyAssignment, isPropertyDeclaration, isPropertyName, isPropertySignature, isQualifiedName, isRestTypeNode, isReturnStatement,
        isSatisfiesExpression, isSetAccessorDeclaration, isShorthandPropertyAssignment, isSourceFile, isSpreadAssignment,
        isSpreadElement, isStatement, isStringLiteralOrJsxExpression, isSwitchStatement, isTaggedTemplateExpression,
        isTemplateExpression, isTemplateHead, isTemplateLiteral, isTemplateLiteralTypeNode, isTemplateLiteralTypeSpan,
        isTemplateMiddleOrTemplateTail, isTemplateSpan, isThrowStatement, isTryStatement, isTupleTypeNode, isTypeAliasDeclaration,
        isTypeAssertionExpression, isTypeElement, isTypeLiteralNode, isTypeNode, isTypeOfExpression, isTypeOperatorNode,
        isTypeParameterDeclaration, isTypePredicateNode, isTypeQueryNode, isTypeReferenceNode, isUnionTypeNode, isVariableDeclaration,
        isVariableDeclarationList, isVariableStatement, isVoidExpression, isWhileStatement, isWithStatement, isYieldExpression,
        visitNode: nodeVisitor, visitNodes: nodesVisitor,
        visitParameterList, visitFunctionBody, visitIterationBody, visitLexicalEnvironment,
        Debug
    } = tsInstance;

    if (isQualifiedName(node))
        return context.factory.updateQualifiedName(
            node,
            Debug.checkDefined(nodeVisitor(node.left, wrap(visitor), isEntityName)),
            Debug.checkDefined(nodeVisitor(node.right, wrap(visitor), isIdentifier))
        ) as any;
    else if (isComputedPropertyName(node))
        return context.factory.updateComputedPropertyName(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isTypeParameterDeclaration(node))
        return context.factory.updateTypeParameterDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifier),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier)),
            nodeVisitor(node.constraint, wrap(visitor), isTypeNode),
            nodeVisitor(node.default, wrap(visitor), isTypeNode)
        ) as any;
    else if (isParameter(node))
        return context.factory.updateParameterDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            node.dotDotDotToken,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isBindingName)),
            node.questionToken,
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            nodeVisitor(node.initializer, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isDecorator(node))
        return context.factory.updateDecorator(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isPropertySignature(node))
        return context.factory.updatePropertySignature(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifier),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            node.questionToken,
            nodeVisitor(node.type, wrap(visitor), isTypeNode)
        ) as any;
    else if (isPropertyDeclaration(node))
        return context.factory.updatePropertyDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            node.questionToken ?? node.exclamationToken,
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            nodeVisitor(node.initializer, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isMethodSignature(node))
        return context.factory.updateMethodSignature(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifier),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            node.questionToken,
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.parameters, wrap(visitor), isParameter),
            nodeVisitor(node.type, wrap(visitor), isTypeNode)
        ) as any;
    else if (isMethodDeclaration(node))
        return context.factory.updateMethodDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            node.asteriskToken,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            node.questionToken,
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            visitParameterList(node.parameters, wrap(visitor), context, nodesVisitor),
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isConstructorDeclaration(node))
        return context.factory.updateConstructorDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            visitParameterList(node.parameters, wrap(visitor), context, nodesVisitor),
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isGetAccessorDeclaration(node))
        return context.factory.updateGetAccessorDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            visitParameterList(node.parameters, wrap(visitor), context, nodesVisitor),
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isSetAccessorDeclaration(node))
        return context.factory.updateSetAccessorDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            visitParameterList(node.parameters, wrap(visitor), context, nodesVisitor),
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isClassStaticBlockDeclaration(node)) {
        context.startLexicalEnvironment();
        context.suspendLexicalEnvironment();
        return context.factory.updateClassStaticBlockDeclaration(
            node,
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    } else if (isCallSignatureDeclaration(node))
        return context.factory.updateCallSignature(
            node,
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.parameters, wrap(visitor), isParameter),
            nodeVisitor(node.type, wrap(visitor), isTypeNode)
        ) as any;
    else if (isConstructSignatureDeclaration(node))
        return context.factory.updateConstructSignature(
            node,
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.parameters, wrap(visitor), isParameter),
            nodeVisitor(node.type, wrap(visitor), isTypeNode)
        ) as any;
    else if (isIndexSignatureDeclaration(node))
        return context.factory.updateIndexSignature(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            nodesVisitor(node.parameters, wrap(visitor), isParameter),
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isTypePredicateNode(node))
        return context.factory.updateTypePredicateNode(
            node,
            nodeVisitor(node.assertsModifier, wrap(visitor), isAssertsKeyword),
            Debug.checkDefined(nodeVisitor(node.parameterName, wrap(visitor), isIdentifierOrThisTypeNode)),
            nodeVisitor(node.type, wrap(visitor), isTypeNode)
        ) as any;
    else if (isTypeReferenceNode(node))
        return context.factory.updateTypeReferenceNode(
            node,
            Debug.checkDefined(nodeVisitor(node.typeName, wrap(visitor), isEntityName)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode)
        ) as any;
    else if (isFunctionTypeNode(node))
        return context.factory.updateFunctionTypeNode(
            node,
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.parameters, wrap(visitor), isParameter),
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isConstructorTypeNode(node))
        return context.factory.updateConstructorTypeNode(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifier),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.parameters, wrap(visitor), isParameter),
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isTypeQueryNode(node))
        return context.factory.updateTypeQueryNode(
            node,
            Debug.checkDefined(nodeVisitor(node.exprName, wrap(visitor), isEntityName)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode)
        ) as any;
    else if (isTypeLiteralNode(node))
        return context.factory.updateTypeLiteralNode(
            node,
            nodesVisitor(node.members, wrap(visitor), isTypeElement)
        ) as any;
    else if (isArrayTypeNode(node))
        return context.factory.updateArrayTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.elementType, wrap(visitor), isTypeNode))
        ) as any;
    else if (isTupleTypeNode(node))
        return context.factory.updateTupleTypeNode(
            node,
            nodesVisitor(node.elements, wrap(visitor), isTypeNode)
        ) as any;
    else if (isOptionalTypeNode(node))
        return context.factory.updateOptionalTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isRestTypeNode(node))
        return context.factory.updateRestTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isUnionTypeNode(node))
        return context.factory.updateUnionTypeNode(
            node,
            nodesVisitor(node.types, wrap(visitor), isTypeNode)
        ) as any;
    else if (isIntersectionTypeNode(node))
        return context.factory.updateIntersectionTypeNode(
            node,
            nodesVisitor(node.types, wrap(visitor), isTypeNode)
        ) as any;
    else if (isConditionalTypeNode(node))
        return context.factory.updateConditionalTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.checkType, wrap(visitor), isTypeNode)),
            Debug.checkDefined(nodeVisitor(node.extendsType, wrap(visitor), isTypeNode)),
            Debug.checkDefined(nodeVisitor(node.trueType, wrap(visitor), isTypeNode)),
            Debug.checkDefined(nodeVisitor(node.falseType, wrap(visitor), isTypeNode))
        ) as any;
    else if (isInferTypeNode(node))
        return context.factory.updateInferTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.typeParameter, wrap(visitor), isTypeParameterDeclaration))
        ) as any;
    else if (isImportTypeNode(node))
        return context.factory.updateImportTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.argument, wrap(visitor), isTypeNode)),
            nodeVisitor(node.attributes, wrap(visitor), isImportAttributes),
            nodeVisitor(node.qualifier, wrap(visitor), isEntityName),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode),
            node.isTypeOf
        ) as any;
    else if (isImportTypeAssertionContainer(node))
        return context.factory.updateImportTypeAssertionContainer(
            node,
            Debug.checkDefined(nodeVisitor(node.assertClause, wrap(visitor), isAssertClause)),
            node.multiLine
        ) as any;
    else if (isNamedTupleMember(node))
        return context.factory.updateNamedTupleMember(
            node,
            node.dotDotDotToken,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier)),
            node.questionToken,
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isParenthesizedTypeNode(node))
        return context.factory.updateParenthesizedType(
            node,
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isTypeOperatorNode(node))
        return context.factory.updateTypeOperatorNode(
            node,
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isIndexedAccessTypeNode(node))
        return context.factory.updateIndexedAccessTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.objectType, wrap(visitor), isTypeNode)),
            Debug.checkDefined(nodeVisitor(node.indexType, wrap(visitor), isTypeNode))
        ) as any;
    else if (isMappedTypeNode(node))
        return context.factory.updateMappedTypeNode(
            node,
            node.readonlyToken,
            Debug.checkDefined(nodeVisitor(node.typeParameter, wrap(visitor), isTypeParameterDeclaration)),
            nodeVisitor(node.nameType, wrap(visitor), isTypeNode),
            node.questionToken,
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            nodesVisitor(node.members, wrap(visitor), isTypeElement)
        ) as any;
    else if (isLiteralTypeNode(node))
        return context.factory.updateLiteralTypeNode(
            node,
            Debug.checkDefined(nodeVisitor(node.literal, wrap(visitor), isLiteralTypeLiteral))
        ) as any;
    else if (isTemplateLiteralTypeNode(node))
        return context.factory.updateTemplateLiteralType(
            node,
            Debug.checkDefined(nodeVisitor(node.head, wrap(visitor), isTemplateHead)),
            nodesVisitor(node.templateSpans, wrap(visitor), isTemplateLiteralTypeSpan)
        ) as any;
    else if (isTemplateLiteralTypeSpan(node))
        return context.factory.updateTemplateLiteralTypeSpan(
            node,
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode)),
            Debug.checkDefined(nodeVisitor(node.literal, wrap(visitor), isTemplateMiddleOrTemplateTail))
        ) as any;
    else if (isObjectBindingPattern(node))
        return context.factory.updateObjectBindingPattern(
            node,
            nodesVisitor(node.elements, wrap(visitor), isBindingElement)
        ) as any;
    else if (isArrayBindingPattern(node))
        return context.factory.updateArrayBindingPattern(
            node,
            nodesVisitor(node.elements, wrap(visitor), isArrayBindingElement)
        ) as any;
    else if (isBindingElement(node))
        return context.factory.updateBindingElement(
            node,
            node.dotDotDotToken,
            nodeVisitor(node.propertyName, wrap(visitor), isPropertyName),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isBindingName)),
            nodeVisitor(node.initializer, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isArrayLiteralExpression(node))
        return context.factory.updateArrayLiteralExpression(
            node,
            nodesVisitor(node.elements, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isObjectLiteralExpression(node))
        return context.factory.updateObjectLiteralExpression(
            node,
            nodesVisitor(node.properties, wrap(visitor), isObjectLiteralElementLike)
        ) as any;
    else if (isPropertyAccessExpression(node))
        return isPropertyAccessChain(node) ? context.factory.updatePropertyAccessChain(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            node.questionDotToken,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isMemberName))
        ) : context.factory.updatePropertyAccessExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isMemberName))
        ) as any;
    else if (isElementAccessExpression(node))
        return isElementAccessChain(node) ? context.factory.updateElementAccessChain(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            node.questionDotToken,
            Debug.checkDefined(nodeVisitor(node.argumentExpression, wrap(visitor, VisitHint.Expression), isExpression))
        ) : context.factory.updateElementAccessExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.argumentExpression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isCallExpression(node))
        return isCallChain(node) ? context.factory.updateCallChain(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            node.questionDotToken,
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode),
            nodesVisitor(node.arguments, wrap(visitor, VisitHint.Expression), isExpression)
        ) : context.factory.updateCallExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode),
            nodesVisitor(node.arguments, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isNewExpression(node))
        return context.factory.updateNewExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode),
            nodesVisitor(node.arguments, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isTaggedTemplateExpression(node))
        return context.factory.updateTaggedTemplateExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.tag, wrap(visitor, VisitHint.Expression), isExpression)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode),
            Debug.checkDefined(nodeVisitor(node.template, wrap(visitor), isTemplateLiteral))
        ) as any;
    else if (isTypeAssertionExpression(node))
        return context.factory.updateTypeAssertion(
            node,
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode)),
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isParenthesizedExpression(node))
        return context.factory.updateParenthesizedExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isFunctionExpression(node))
        return context.factory.updateFunctionExpression(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifier),
            node.asteriskToken,
            nodeVisitor(node.name, wrap(visitor), isIdentifier),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            visitParameterList(node.parameters, wrap(visitor), context, nodesVisitor),
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isArrowFunction(node))
        return context.factory.updateArrowFunction(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifier),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            visitParameterList(node.parameters, wrap(visitor), context, nodesVisitor),
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            node.equalsGreaterThanToken,
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isDeleteExpression(node))
        return context.factory.updateDeleteExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isTypeOfExpression(node))
        return context.factory.updateTypeOfExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isVoidExpression(node))
        return context.factory.updateVoidExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isAwaitExpression(node))
        return context.factory.updateAwaitExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isPrefixUnaryExpression(node))
        return context.factory.updatePrefixUnaryExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.operand, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isPostfixUnaryExpression(node))
        return context.factory.updatePostfixUnaryExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.operand, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isBinaryExpression(node))
        return context.factory.updateBinaryExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.left, wrap(visitor, VisitHint.Expression), isExpression)),
            node.operatorToken,
            Debug.checkDefined(nodeVisitor(node.right, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isConditionalExpression(node))
        return context.factory.updateConditionalExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.condition, wrap(visitor, VisitHint.Expression), isExpression)),
            node.questionToken,
            Debug.checkDefined(nodeVisitor(node.whenTrue, wrap(visitor, VisitHint.Expression), isExpression)),
            node.colonToken,
            Debug.checkDefined(nodeVisitor(node.whenFalse, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isTemplateExpression(node))
        return context.factory.updateTemplateExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.head, wrap(visitor), isTemplateHead)),
            nodesVisitor(node.templateSpans, wrap(visitor), isTemplateSpan)
        ) as any;
    else if (isYieldExpression(node))
        return context.factory.updateYieldExpression(
            node,
            node.asteriskToken,
            nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isSpreadElement(node))
        return context.factory.updateSpreadElement(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isClassExpression(node))
        return context.factory.updateClassExpression(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            nodeVisitor(node.name, wrap(visitor), isIdentifier),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.heritageClauses, wrap(visitor), isHeritageClause),
            nodesVisitor(node.members, wrap(visitor), isClassElement)
        ) as any;
    else if (isExpressionWithTypeArguments(node))
        return context.factory.updateExpressionWithTypeArguments(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode)
        ) as any;
    else if (isAsExpression(node))
        return context.factory.updateAsExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isSatisfiesExpression(node))
        return context.factory.updateSatisfiesExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isNonNullExpression(node))
        return isOptionalChain(node) ? context.factory.updateNonNullChain(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) : context.factory.updateNonNullExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isMetaProperty(node))
        return context.factory.updateMetaProperty(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier))
        ) as any;
    else if (isTemplateSpan(node))
        return context.factory.updateTemplateSpan(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.literal, wrap(visitor), isTemplateMiddleOrTemplateTail))
        ) as any;
    else if (isBlock(node))
        return context.factory.updateBlock(
            node,
            nodesVisitor(node.statements, wrap(visitor), isStatement)
        ) as any;
    else if (isVariableStatement(node))
        return context.factory.updateVariableStatement(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.declarationList, wrap(visitor), isVariableDeclarationList))
        ) as any;
    else if (isExpressionStatement(node))
        return context.factory.updateExpressionStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isIfStatement(node))
        return context.factory.updateIfStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.thenStatement, wrap(visitor), isStatement, context.factory.liftToBlock)),
            nodeVisitor(node.elseStatement, wrap(visitor), isStatement, context.factory.liftToBlock)
        ) as any;
    else if (isDoStatement(node))
        return context.factory.updateDoStatement(
            node,
            visitIterationBody(node.statement, wrap(visitor), context, nodeVisitor),
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isWhileStatement(node))
        return context.factory.updateWhileStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            visitIterationBody(node.statement, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isForStatement(node))
        return context.factory.updateForStatement(
            node,
            nodeVisitor(node.initializer, wrap(visitor), isForInitializer),
            nodeVisitor(node.condition, wrap(visitor, VisitHint.Expression), isExpression),
            nodeVisitor(node.incrementor, wrap(visitor, VisitHint.Expression), isExpression),
            visitIterationBody(node.statement, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isForInStatement(node))
        return context.factory.updateForInStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.initializer, wrap(visitor), isForInitializer)),
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            visitIterationBody(node.statement, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isForOfStatement(node))
        return context.factory.updateForOfStatement(
            node,
            node.awaitModifier,
            Debug.checkDefined(nodeVisitor(node.initializer, wrap(visitor), isForInitializer)),
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            visitIterationBody(node.statement, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isContinueStatement(node))
        return context.factory.updateContinueStatement(
            node,
            nodeVisitor(node.label, wrap(visitor), isIdentifier)
        ) as any;
    else if (isBreakStatement(node))
        return context.factory.updateBreakStatement(
            node,
            nodeVisitor(node.label, wrap(visitor), isIdentifier)
        ) as any;
    else if (isReturnStatement(node))
        return context.factory.updateReturnStatement(
            node,
            nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isWithStatement(node))
        return context.factory.updateWithStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.statement, wrap(visitor), isStatement, context.factory.liftToBlock))
        ) as any;
    else if (isSwitchStatement(node))
        return context.factory.updateSwitchStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            Debug.checkDefined(nodeVisitor(node.caseBlock, wrap(visitor), isCaseBlock))
        ) as any;
    else if (isLabeledStatement(node))
        return context.factory.updateLabeledStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.label, wrap(visitor), isIdentifier)),
            Debug.checkDefined(nodeVisitor(node.statement, wrap(visitor), isStatement, context.factory.liftToBlock))
        ) as any;
    else if (isThrowStatement(node))
        return context.factory.updateThrowStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isTryStatement(node))
        return context.factory.updateTryStatement(
            node,
            Debug.checkDefined(nodeVisitor(node.tryBlock, wrap(visitor), isBlock)),
            nodeVisitor(node.catchClause, wrap(visitor), isCatchClause),
            nodeVisitor(node.finallyBlock, wrap(visitor), isBlock)
        ) as any;
    else if (isVariableDeclaration(node))
        return context.factory.updateVariableDeclaration(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isBindingName)),
            node.exclamationToken,
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            nodeVisitor(node.initializer, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isVariableDeclarationList(node))
        return context.factory.updateVariableDeclarationList(
            node,
            nodesVisitor(node.declarations, wrap(visitor), isVariableDeclaration)
        ) as any;
    else if (isFunctionDeclaration(node))
        return context.factory.updateFunctionDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifier),
            node.asteriskToken,
            nodeVisitor(node.name, wrap(visitor), isIdentifier),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            visitParameterList(node.parameters, wrap(visitor), context, nodesVisitor),
            nodeVisitor(node.type, wrap(visitor), isTypeNode),
            visitFunctionBody(node.body, wrap(visitor), context, nodeVisitor)
        ) as any;
    else if (isClassDeclaration(node))
        return context.factory.updateClassDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            nodeVisitor(node.name, wrap(visitor), isIdentifier),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.heritageClauses, wrap(visitor), isHeritageClause),
            nodesVisitor(node.members, wrap(visitor), isClassElement)
        ) as any;
    else if (isInterfaceDeclaration(node))
        return context.factory.updateInterfaceDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier)),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            nodesVisitor(node.heritageClauses, wrap(visitor), isHeritageClause),
            nodesVisitor(node.members, wrap(visitor), isTypeElement)
        ) as any;
    else if (isTypeAliasDeclaration(node))
        return context.factory.updateTypeAliasDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier)),
            nodesVisitor(node.typeParameters, wrap(visitor), isTypeParameterDeclaration),
            Debug.checkDefined(nodeVisitor(node.type, wrap(visitor), isTypeNode))
        ) as any;
    else if (isEnumDeclaration(node))
        return context.factory.updateEnumDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier)),
            nodesVisitor(node.members, wrap(visitor), isEnumMember)
        ) as any;
    else if (isModuleDeclaration(node))
        return context.factory.updateModuleDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isModuleName)),
            nodeVisitor(node.body, wrap(visitor), isModuleBody)
        ) as any;
    else if (isModuleBlock(node))
        return context.factory.updateModuleBlock(
            node,
            nodesVisitor(node.statements, wrap(visitor), isStatement)
        ) as any;
    else if (isCaseBlock(node))
        return context.factory.updateCaseBlock(
            node,
            nodesVisitor(node.clauses, wrap(visitor), isCaseOrDefaultClause)
        ) as any;
    else if (isNamespaceExportDeclaration(node))
        return context.factory.updateNamespaceExportDeclaration(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier))
        ) as any;
    else if (isImportEqualsDeclaration(node))
        return context.factory.updateImportEqualsDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            node.isTypeOnly,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier)),
            Debug.checkDefined(nodeVisitor(node.moduleReference, wrap(visitor), isModuleReference))
        ) as any;
    else if (isImportDeclaration(node))
        return context.factory.updateImportDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            nodeVisitor(node.importClause, wrap(visitor), isImportClause),
            Debug.checkDefined(nodeVisitor(node.moduleSpecifier, wrap(visitor, VisitHint.Expression), isExpression)),
            nodeVisitor(node.attributes, wrap(visitor), isImportAttributes)
        ) as any;
    else if (isImportAttributes(node))
        return context.factory.updateImportAttributes(
            node,
            nodesVisitor(node.elements, wrap(visitor), isImportAttribute),
            node.multiLine
        ) as any;
    else if (isImportAttribute(node))
        return context.factory.updateImportAttribute(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isImportAttributeName)),
            Debug.checkDefined(nodeVisitor(node.value, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isImportClause(node))
        return context.factory.updateImportClause(
            node,
            node.isTypeOnly,
            nodeVisitor(node.name, wrap(visitor), isIdentifier),
            nodeVisitor(node.namedBindings, wrap(visitor), isNamedImportBindings)
        ) as any;
    else if (isNamespaceImport(node))
        return context.factory.updateNamespaceImport(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier))
        ) as any;
    else if (isNamespaceExport(node))
        return context.factory.updateNamespaceExport(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier))
        ) as any;
    else if (isNamedImports(node))
        return context.factory.updateNamedImports(
            node,
            nodesVisitor(node.elements, wrap(visitor), isImportSpecifier)
        ) as any;
    else if (isImportSpecifier(node))
        return context.factory.updateImportSpecifier(
            node,
            node.isTypeOnly,
            nodeVisitor(node.propertyName, wrap(visitor), isIdentifier),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier))
        ) as any;
    else if (isExportAssignment(node))
        return context.factory.updateExportAssignment(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isExportDeclaration(node))
        return context.factory.updateExportDeclaration(
            node,
            nodesVisitor(node.modifiers, wrap(visitor), isModifierLike),
            node.isTypeOnly,
            nodeVisitor(node.exportClause, wrap(visitor), isNamedExportBindings),
            nodeVisitor(node.moduleSpecifier, wrap(visitor, VisitHint.Expression), isExpression),
            nodeVisitor(node.attributes, wrap(visitor), isImportAttributes)
        ) as any;
    else if (isNamedExports(node))
        return context.factory.updateNamedExports(
            node,
            nodesVisitor(node.elements, wrap(visitor), isExportSpecifier)
        ) as any;
    else if (isExportSpecifier(node))
        return context.factory.updateExportSpecifier(
            node,
            node.isTypeOnly,
            nodeVisitor(node.propertyName, wrap(visitor), isIdentifier),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier))
        ) as any;
    else if (isExternalModuleReference(node))
        return context.factory.updateExternalModuleReference(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isJsxElement(node))
        return context.factory.updateJsxElement(
            node,
            Debug.checkDefined(nodeVisitor(node.openingElement, wrap(visitor), isJsxOpeningElement)),
            nodesVisitor(node.children, wrap(visitor), isJsxChild),
            Debug.checkDefined(nodeVisitor(node.closingElement, wrap(visitor), isJsxClosingElement))
        ) as any;
    else if (isJsxSelfClosingElement(node))
        return context.factory.updateJsxSelfClosingElement(
            node,
            Debug.checkDefined(nodeVisitor(node.tagName, wrap(visitor), isJsxTagNameExpression)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode),
            Debug.checkDefined(nodeVisitor(node.attributes, wrap(visitor), isJsxAttributes))
        ) as any;
    else if (isJsxOpeningElement(node))
        return context.factory.updateJsxOpeningElement(
            node,
            Debug.checkDefined(nodeVisitor(node.tagName, wrap(visitor), isJsxTagNameExpression)),
            nodesVisitor(node.typeArguments, wrap(visitor), isTypeNode),
            Debug.checkDefined(nodeVisitor(node.attributes, wrap(visitor), isJsxAttributes))
        ) as any;
    else if (isJsxClosingElement(node))
        return context.factory.updateJsxClosingElement(
            node,
            Debug.checkDefined(nodeVisitor(node.tagName, wrap(visitor), isJsxTagNameExpression))
        ) as any;
    else if (isJsxNamespacedName(node))
        return context.factory.updateJsxNamespacedName(
            node,
            Debug.checkDefined(nodeVisitor(node.namespace, wrap(visitor), isIdentifier)),
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier))
        ) as any;
    else if (isJsxFragment(node))
        return context.factory.updateJsxFragment(
            node,
            Debug.checkDefined(nodeVisitor(node.openingFragment, wrap(visitor), isJsxOpeningFragment)),
            nodesVisitor(node.children, wrap(visitor), isJsxChild),
            Debug.checkDefined(nodeVisitor(node.closingFragment, wrap(visitor), isJsxClosingFragment))
        ) as any;
    else if (isJsxAttribute(node))
        return context.factory.updateJsxAttribute(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isJsxAttributeName)),
            nodeVisitor(node.initializer, wrap(visitor), isStringLiteralOrJsxExpression)
        ) as any;
    else if (isJsxAttributes(node))
        return context.factory.updateJsxAttributes(
            node,
            nodesVisitor(node.properties, wrap(visitor), isJsxAttributeLike)
        ) as any;
    else if (isJsxSpreadAttribute(node))
        return context.factory.updateJsxSpreadAttribute(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isJsxExpression(node))
        return context.factory.updateJsxExpression(
            node,
            nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isCaseClause(node))
        return context.factory.updateCaseClause(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression)),
            nodesVisitor(node.statements, wrap(visitor), isStatement)
        ) as any;
    else if (isDefaultClause(node))
        return context.factory.updateDefaultClause(
            node,
            nodesVisitor(node.statements, wrap(visitor), isStatement)
        ) as any;
    else if (isHeritageClause(node))
        return context.factory.updateHeritageClause(
            node,
            nodesVisitor(node.types, wrap(visitor, VisitHint.Expression), isExpressionWithTypeArguments)
        ) as any;
    else if (isCatchClause(node))
        return context.factory.updateCatchClause(
            node,
            nodeVisitor(node.variableDeclaration, wrap(visitor), isVariableDeclaration),
            Debug.checkDefined(nodeVisitor(node.block, wrap(visitor), isBlock))
        ) as any;
    else if (isPropertyAssignment(node))
        return context.factory.updatePropertyAssignment(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            Debug.checkDefined(nodeVisitor(node.initializer, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isShorthandPropertyAssignment(node))
        return context.factory.updateShorthandPropertyAssignment(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isIdentifier)),
            nodeVisitor(node.objectAssignmentInitializer, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isSpreadAssignment(node))
        return context.factory.updateSpreadAssignment(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isEnumMember(node))
        return context.factory.updateEnumMember(
            node,
            Debug.checkDefined(nodeVisitor(node.name, wrap(visitor), isPropertyName)),
            nodeVisitor(node.initializer, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    else if (isSourceFile(node))
        return context.factory.updateSourceFile(
            node,
            visitLexicalEnvironment(node.statements, wrap(visitor), context)
        ) as any;
    else if (isPartiallyEmittedExpression(node))
        return context.factory.updatePartiallyEmittedExpression(
            node,
            Debug.checkDefined(nodeVisitor(node.expression, wrap(visitor, VisitHint.Expression), isExpression))
        ) as any;
    else if (isCommaListExpression(node))
        return context.factory.updateCommaListExpression(
            node,
            nodesVisitor(node.elements, wrap(visitor, VisitHint.Expression), isExpression)
        ) as any;
    
    return node;
}