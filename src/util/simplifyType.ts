import type ts from "typescript";
import type { State } from "..";

export default function simplifyType(state: State, type: ts.Type): ts.Type {
    if (type.isIndexType())
        return state.typeChecker.getUnionType(
            state.typeChecker.getIndexInfosOfType(simplifyType(state, type.type))
                .map((info) => info.keyType)
                .filter((type) => type)
        );
    else if (type.isTypeParameter())
        return simplifyType(state, state.typeChecker.getBaseConstraintOfType(type)!);

    return type;
}