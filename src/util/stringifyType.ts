import type ts from "typescript";
import type { State } from "..";
import { TypeMatcher } from "../typeMatcher";
import simplifyType from "./simplifyType";

export default function stringifyType(state: State, type: ts.Type): string {
    type = simplifyType(state, type);

    const typeMatcher = new TypeMatcher(state.tsInstance, state.typeChecker);
    if (typeMatcher.isObjectType(type)) {
        return "Object";
    } else if (typeMatcher.isSymbolType(type)) {
        return "Symbol";
    } else if (typeMatcher.isBooleanType(type)) {
        return "Boolean";
    } else if (typeMatcher.isNumberType(type)) {
        return "Number";
    } else if (typeMatcher.isBigIntType(type)) {
        return "BigInt";
    } else if (typeMatcher.isStringType(type)) {
        return "String";
    } else if (typeMatcher.isFunctionType(type)) {
        return "Function";
    } else if (type.isUnion()) {
        return "(" + type.types.map((member) => stringifyType(state, member)).join(" or ") + ")";
    } else {
        return state.typeChecker.typeToString(type);
    }
}