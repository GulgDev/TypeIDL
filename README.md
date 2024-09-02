# TypeIDL

TypeIDL is a TypeScript transformer for building clean API that can be safely exposed to users. It is based on WebIDL standard that is used in every modern JavaScript engine. TypeIDL is more than just type-checker, it also provides a variety of security features like internal properties and methods and untrusted globals mode.

TypeIDL can help you build intrinsic-like APIs by writing regular TS code:
```ts
class API {
    stringProperty: string;

    readonly readonlyProperty: boolean = true;

    takesNumber(value: number) {
        if (typeof value === "number")
            console.log("I got a number", value);
        else
            console.log("I didn't get a number :(", value);
    }

    takesAPI(api: API) {
        console.log("I got", api.constructor.name);
    }
}

function consumer(api: any) {
    api.takesNumber(123); // Give API expected input
    api.takesNumber("123"); // API will automatically convert any given values to corresponding types

    api.takesAPI(api); // This method takes the API instance itself
    try {
        api.takesAPI({ /* ... */ }); // If the value cannot be converted, TypeError will be thrown
    } catch (err) {
        console.log(err);
    }

    api.stringProperty = "Hello world!"; // Properties are type-checked too!
    api.stringProperty = 123; // stringProperty is now "123"
    console.log("String property has value", api.stringProperty, "of type", typeof api.stringProperty);

    console.log("Readonly property is", api.readonlyProperty);
    try {
        api.readonlyProperty = false; // You cannot change readonly properties (will throw in strict mode)
    } catch (err) {
        console.log(err);
    }
    console.log("Readonly property is still", api.readonlyProperty);
}

consumer(new API()); // You can expose APIs compiled with TypeIDL to any JS consumer code
```

## Features
### WebIDL type conversion
TypeIDL inserts converters and validators to every method based on its declaration. TypeIDL makes sure that if the function executes, it gets exactly what it expects. TypeIDL works with unions, interfaces and classes, primitive types, type literals, and even provides basic template types validation. Note that TypeIDL does not perform type conversion in internal or private methods.

### Internal functions
TypeIDL provides a way to create a function that can **only** be called from inside the project:
```ts
class API {
    /**
     * @internal
     */
    foo(bar: string) {
        console.log("foo'ing with", bar);
    }
}

new API().foo("bar"); // foo'ing with bar

(new API() as any).foo("bar"); // not working
```
If constructor is not declared explicitly, TypeIDL would mark it as internal by default. Classes with internal constructors cannot be constructed outside of the project.

### Untrusted globals mode
If you want to run your code in an untrusted environment, you can setup TypeIDL to not trust the global scope. If you do so, TypeIDL will store globals at the beginning of the module and use stored references instead of the actual globals. You can also prefix global object access with `globalThis.` to get the current state.

### Ignoring TypeIDL transformation
To ignore TypeIDL transformation when accessing properties, use square brackes: `object["property"]`.

## Installing
First, install TypeIDL, TypeScript and ts-patch:
```
npm i -D typescript ts-patch typeidl
npx ts-patch install
```
Then, add the TypeIDL transformer to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "plugins": [{ "transform": "typeidl" }]
  }
}
```
After that, you can write TypeScript code and compile it to JavaScript with `tsc` like usual.

## Config
You can pass options to TypeIDL to configure how it works:
```js
{
  "compilerOptions": {
    "plugins": [{
      "transform": "typeidl",
      "treatMissingConstructorAsInternal": true, // Treat missing constructors in IDL classes as internal
      "useIDLDecorator": false, // Require @idl decorator to apply IDL validations to classes
      "trustGlobals": true // If set to false, TypeIDL will transform the source to store globals in the module scope
    }]
  }
}
```