import { doesNotThrow, equal, throws } from "assert";
import { compileAndLoad } from "../lib/testUtils";
import { withProperties } from "../lib/withProperties";

describe("Options", () => {
    it("should keep references to global objects when 'trustGlobals' is 'false'", async () => {
        const { object } = await compileAndLoad(`
            class Test {
                callStaticMethod() {
                    equal(Array.isArray([]), true);
                }

                callMethod() {
                    const array: any[] = [];
                    array.push(123);
                    equal(array.length, 1);
                }
            }
        
            export const object = new Test();
        `, { equal }, { trustGlobals: false });

        withProperties(
            Array,
            { isArray: () => false },
            () => object.callStaticMethod()
        );

        withProperties(
            Array.prototype,
            { push: () => void 0 },
            () => object.callMethod()
        );
    });

    it("should only apply validation to classes with 'idl' decorator when 'useIDLDecorator' is 'true'", async () => {
        const { object1, object2 } = await compileAndLoad(`
            import { idl } from "typeidl";

            class Test1 {
                getValue(value: number) {
                    return value;
                }
            }

            @idl class Test2 {
                getValue(value: number) {
                    return value;
                }
            }
        
            export const object1 = new Test1();
            export const object2 = new Test2();
        `, undefined, { useIDLDecorator: true });

        equal(object1.getValue("123"), "123");

        equal(object2.getValue("123"), 123);
    });

    it("should not mark missing constructor as internal when 'treatMissingConstructorAsInternal' is 'false'", async () => {
        const { Test1 } = await compileAndLoad(`
            export class Test1 { }
        `);

        const { Test2 } = await compileAndLoad(`
            export class Test2 { }
        `, undefined, { treatMissingConstructorAsInternal: false });

        throws(() => new Test1(), TypeError);

        doesNotThrow(() => new Test2(), TypeError);
    });
});