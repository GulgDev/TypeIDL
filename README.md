# TypeIDL

TypeIDL is a TypeScript transformer for building clean API that can be safely exposed to users. It is based on WebIDL standard that is used in every modern JavaScript engine.

When used right, TypeIDL can help building classes and functions that will do what they must do and nothing more. TypeIDL handles validation just by utilizing your types. When a class is exposed, internal APIs should never access its public methods and properties, but instead use `#private` ones.

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
If constructor is not declared explicitly, TypeIDL would mark it as internal. Classes with internal constructors cannot be constructed outside of the project. But if you know JavaScript, you know that you can "create" class instance without calling the constructor:
```js
const customAPI = Object.create(API.prototype);
customAPI instanceof API; // true
```
But how does TypeIDL know that the given object is legitemate class instance? The answer is simple: if the class was declared inside the project, TypeIDL inserts a special marker to every instance, that is applied to `this` object in the `constructor`. As the result, TypeIDL does not use `instanceof`, but instead utilize internal markers.

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
```json
{
  "compilerOptions": {
    "plugins": [{
      "transform": "typeidl",
      "treatMissingConstructorAsInternal": true, // Treat missing constructors in IDL classes as internal
      "useIDLDecorator": false, // Require @idl decorator to apply IDL validations to class
      "trustGlobals": true // If set to false, TypeIDL will transform the source to save the globals when the module is loaded
    }]
  }
}
```