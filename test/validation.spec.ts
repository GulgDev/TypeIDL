import { doesNotThrow, equal, throws } from "assert";
import { compileAndLoad } from "../lib/testUtils";

describe("Validation", () => {
    it("should be able to convert values to primitive types", async () => {
        const { object } = await compileAndLoad(`
            class Test {
                toNumber(value: number) {
                    return value;
                }

                toString(value: string) {
                    return value;
                }

                toBoolean(value: boolean) {
                    return value;
                }

                toBigInt(value: bigint) {
                    return value;
                }
            }
        
            export const object = new Test();
        `);

        equal(object.toNumber("123"), 123);
        equal(object.toString(123), "123");
        equal(object.toBoolean(1), true);
        equal(object.toBigInt(10), 10n);
    });

    it("should throw if the value cannot be converted", async () => {
        const { object } = await compileAndLoad(`
            interface Interface { }

            class Test {
                expectInterface(value: Interface) { }
            }
        
            export const object = new Test();
        `);

        throws(() => object.expectInterface(123), TypeError);
    });

    it("should throw on illegal invocation", async () => {
        const { Test, object } = await compileAndLoad(`
            export class Test {
                method() { }

                static staticMethod() { }
            }
        
            export const object = new Test();
        `);

        doesNotThrow(() => Test.staticMethod(), TypeError);
        doesNotThrow(Test.staticMethod, TypeError);

        doesNotThrow(() => object.method(), TypeError);
        throws(object.method, TypeError);
    });

    it("should throw when there's not enough arguments", async () => {
        const { object } = await compileAndLoad(`
            class Test {
                method(a: any, b: any, c: any) { }

                methodWithOptionalArgs(a: any, b: any, c?: any) { }
            }
        
            export const object = new Test();
        `);

        doesNotThrow(() => object.method(1, 2, 3), TypeError);
        throws(() => object.method(1, 2), TypeError);

        doesNotThrow(() => object.methodWithOptionalArgs(1, 2, 3), TypeError);
        doesNotThrow(() => object.methodWithOptionalArgs(1, 2), TypeError);
        throws(() => object.methodWithOptionalArgs(1), TypeError);
    });
});