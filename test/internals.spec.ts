import { equal, notEqual, throws } from "assert";
import { compileAndLoad } from "../lib/testUtils";

describe("Internals", () => {
    it("should hide internal properties and methods", async () => {
        const { object } = await compileAndLoad(`
            class Test {
                /** @internal */ internalMethod() { }

                /** @internal */ internalProperty = 123;
            }
        
            export const object = new Test();

            notEqual(object.internalMethod, undefined);
            notEqual(object.internalProperty, undefined);
        `, { notEqual });

        equal(object.internalMethod, undefined);
        equal(object.internalProperty, undefined);
    });

    it("should throw when constructing class with internal constructor", async () => {
        const { Test } = await compileAndLoad(`
            export class Test {
                /** @internal */ constructor() { }
            }
        `);

        throws(() => new Test(), TypeError);
    });

    it("should keep references to instance properties and methods", async () => {
        const { object } = await compileAndLoad(`
            class Test {
                value: string;

                check(value) {
                    equal(this.value, value);
                }
            }
        
            export const object = new Test();
        `, { equal });

        object.value = "test";
        object.check("test");
        equal(object.value, "test");

        Object.defineProperty(object, "value", { value: "test2" });
        object.check("test");
        equal(object.value, "test2");
    });
});