import type ts from "typescript";

export class TypeMatcher {
    constructor(private tsInstance: typeof ts, private typeChecker: ts.TypeChecker) { }

    private getObjectFlags(type: ts.Type): number {
        return "objectFlags" in type ? type.objectFlags as number : 0;
    }

    isUndefinedType(type: ts.Type): boolean {
        return (type.flags & (this.tsInstance.TypeFlags.Undefined | this.tsInstance.TypeFlags.Void)) !== 0;
    }
    
    isNullType(type: ts.Type): boolean {
        return (type.flags & this.tsInstance.TypeFlags.Null) !== 0;
    }

    isBigIntLiteralType(type: ts.Type): type is ts.BigIntLiteralType {
        return (type.flags & this.tsInstance.TypeFlags.BigIntLiteral) !== 0;
    }

    isBooleanLiteralType(type: ts.Type): type is ts.IntrinsicType {
        return (type.flags & this.tsInstance.TypeFlags.BooleanLiteral) !== 0;
    }
    
    isInterfaceType(type: ts.Type): type is ts.InterfaceType {
        return type.isClassOrInterface() && (type.objectFlags & this.tsInstance.ObjectFlags.Reference) === 0;
    }

    isClassType(type: ts.Type): type is ts.InterfaceType {
        return type.isClassOrInterface() && (type.objectFlags & this.tsInstance.ObjectFlags.Reference) !== 0;
    }

    isClassTypeType(type: ts.Type): boolean {
        return (this.getObjectFlags(type) & this.tsInstance.ObjectFlags.Anonymous) !== 0 &&
               (type.symbol.flags & this.tsInstance.SymbolFlags.Class) !== 0;
    }
    
    isFunctionType(type: ts.Type): boolean {
        return type.getCallSignatures().length > 0;
    }
    
    isObjectType(type: ts.Type): boolean {
        return (type.flags & this.tsInstance.TypeFlags.NonPrimitive) !== 0;
    }

    isSymbolType(type: ts.Type): boolean {
        return (type.flags & this.tsInstance.TypeFlags.ESSymbol) !== 0;
    }
    
    isBooleanType(type: ts.Type): type is ts.LiteralType {
        return (type.flags & this.tsInstance.TypeFlags.Boolean) !== 0;
    }
    
    isNumberType(type: ts.Type): type is ts.LiteralType {
        return (type.flags & this.tsInstance.TypeFlags.Number) !== 0;
    }
    
    isBigIntType(type: ts.Type): type is ts.LiteralType {
        return (type.flags & this.tsInstance.TypeFlags.BigInt) !== 0;
    }
    
    isStringType(type: ts.Type): type is ts.LiteralType {
        return (type.flags & this.tsInstance.TypeFlags.String) !== 0;
    }
}