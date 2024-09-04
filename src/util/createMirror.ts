import type ts from "typescript";
import { makeMetadataMemoize } from "../metadata";

export const createMirror = makeMetadataMemoize("mirror",
    (symbol: ts.Symbol, typeChecker: ts.TypeChecker): ts.Symbol => typeChecker.createSymbol(symbol.flags, symbol.escapedName));