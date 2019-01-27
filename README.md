<a href="#top" id="top">
  <img src="https://user-images.githubusercontent.com/441546/41694528-9173990c-74bf-11e8-950a-f02918039662.png" style="max-width: 100%">
</a>
<p align="center">
  <a href="https://www.npmjs.com/package/@darkobits/class-decorators"><img src="https://img.shields.io/npm/v/@darkobits/class-decorators.svg?style=flat-square"></a>
  <a href="https://travis-ci.org/darkobits/class-decorators"><img src="https://img.shields.io/travis/darkobits/class-decorators.svg?style=flat-square"></a>
  <a href="https://david-dm.org/darkobits/class-decorators"><img src="https://img.shields.io/david/darkobits/class-decorators.svg?style=flat-square"></a>
  <a href="https://www.codacy.com/app/darkobits/class-decorators"><img src="https://img.shields.io/codacy/coverage/bd23f052d0ec42b0ada5e46b006e6511.svg?style=flat-square"></a>
  <a href="https://github.com/conventional-changelog/standard-version"><img src="https://img.shields.io/badge/conventional%20commits-1.0.0-027dc6.svg?style=flat-square"></a>
  <a href="https://github.com/sindresorhus/xo"><img src="https://img.shields.io/badge/code_style-XO-e271a5.svg?style=flat-square"></a>
</p>

This package attempts to improve the way classes are decorated (see: [decorator proposal](https://ponyfoo.com/articles/javascript-decorators-proposal)) by not polluting the prototype chain, encouraging _composition over inheritance_.

#### 🚧 **A Note on Performance** 🚧

This package makes use of [`Reflect.setPrototypeOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/setPrototypeOf), which has known performance implications. If you need to create a million instances of a class in an environment where every millisecond counts, **do not use this package**. In fact, you might re-consider the usage of JavaScript at all in such cases. If, however, you are using JavaScript as a general purpose programming language to solve "normal" problems, there will be no noticable change in your application's performance characteristics. Performance benchmarks may be run via `npm run perf`.

## Install

This package requires [`@babel/plugin-proposal-decorators`](https://new.babeljs.io/docs/en/next/babel-plugin-proposal-decorators.html) as a peer dependency and assumes that your code is being transpiled using Babel. It also assumes you have `legacy: true` enabled, as it implements the legacy decorators specification.

```bash
$ npm i -D @babel/plugin-proposal-decorators
$ npm i @darkobits/class-decorators
```

Then, update your `.babelrc` file:

```
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", {"legacy": true}]
  ]
}
```

## Use

### `ClassDecorator`

This package's default export is a function that accepts a decorator implementation function and returns a decorator that may be applied to a class. The decorator implementation function is passed the target class. If the decorator implementation returns
a function, that function will be used as a proxy constructor for the decorated class. The proxy constructor will be passed an object with the following shape:

```ts
{
  // Array of any arguments passed to the constructor.
  args: Array<any>;
  // Invoke this function to call the decorated class' original constructor.
  constructor: Function;
  // 'this' binding, allowing the proxy constructor to be an arrow function.
  context: any;
}
```

**Example:**

In this example, we will create a higher-order decorator that accepts a list of superpowers to apply to class instances.

First, we will look at how this is done using the typical approach, then how to accomplish it using this package.

```ts
function AddSuperpowers (...powers: Array<string>): Function {
  return function (Ctor: Function): typeof Ctor {
    return class AddSuperpowers extends Ctor {
      constructor(...args: Array<any>) {
        super(...args);

        powers.forEach(power => {
          this[power] = true;
        });
      }

      hasSuperpower(power: string): boolean {
        return this[power];
      }
    }
  };
}

@AddSuperpowers('strength', 'speed', 'flight')
class Person {
  name: string;

  constructor(name) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }
}

const bob = new Person('Bob');

bob.strength; //=> true
bob.speed; //=> true
bob.flight; //=> true
```

This approach works, but if we examine the prototype chain of the `bob` instance, it will look something like this:

```
bob: {
  name: 'Bob'
  strength: true
  speed: true
  flight: true
  [[Prototype]] => AddSuperpowers: {
}                    hasSuperpower()
                     [[Prototype]] => Person: {
                   }                    getName()
                                        [[Prototype]] => Object
                                      }
```

If we used 5 decorators on the `Person` class, we would find 5 degrees of inheritance added to each instance of `Person`. Decorators should faciliate _composition_, not exacerbate existing issues with inheritance.

Furthermore, because we are using subclassing to implement our decorator, we are forced to call the decorated class' constructor (via `super`), and we must follow all of the relevant rules around when super calls must be made. This approach reduces decorators to nothing more than syntactical sugar for subclassing, and isn't really employing the [Decorator Pattern](https://addyosmani.com/resources/essentialjsdesignpatterns/book/#decoratorpatternjavascript).

Let's see how with a few modifications we can improve this situation:

```ts
import ClassDecorator from '@darkobits/class-decorators';

const AddSuperpowers = (...powers: Array<string>): Function => ClassDecorator(Ctor => {
  // Add a hasSuperpower method to the decorated class.
  Ctor.prototype.hasSuperpower = function (power: string): boolean {
    return this[power];
  };

  // Returning a function here will result in the function acting as a proxy
  // constructor for the decorated class.
  return function ({constructor, args}): void {
    powers.forEach(power => {
      this[power] = true;
    });

    // (Optionally) call the original constructor, forwarding any arguments
    // provided.
    constructor(...args);
  }
});


@AddSuperpowers('strength', 'speed', 'flight')
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }
}

const bob = new Person('Bob');
```

Notice that we now have full control over when and how the original constructor is called. We can even decide to not call it at all. And, if we looked at the protoype chain for this instance of `Person`, we would see:

```
bob: {
  name: 'Bob'
  strength: true
  speed: true
  flight: true
  [[Prototype]] => Person: {
}                    getName()
                     hasSuperpower()
                     [[Prototype]] => Object
                   }
```

### `MethodDecorator`

Accepts a decorator implementation function and returns a decorator that may be applied to class methods. The decorator implementation function is passed a single object with the following shape:

```ts
{
  // Prototype object that owns the decorated method.
  prototype: object;
  // Name of the decorated method.
  methodName: string;
  // Property descriptor of the decorated method.
  descriptor: PropertyDescriptor;
}
```

If the decorator implementation function returns a function, the returned function will act as a proxy for the original method. The proxy will be invoked each time the original method is called, and is passed a single object with the following shape:

```ts
{
  // Any arguments passed to the method call.
  args: Array<any>;
  // Original method, pre-bound to the class instance.
  method: Function;
}
```

**Example:**

```ts
import {MethodDecorator} from '@darkobits/class-decorators';

const AddSalutation = MethodDecorator(({prototype, methodName}) => {
  // Optionally manipulate prototype here.

  // Return a function which will serve as a delegate for the original method.
  return ({args, method}) => `Hello, my name is ${method()}.`;
});

class Person {
  name: string;

  constructor(name: string): void {
    this.name = name;
  }

  @AddSalutation
  getName(): string {
    return this.name;
  }
}

const bob = new Person('Bob');
bob.getName() //=> 'Hello, my name is Bob.'
```

## &nbsp;
<p align="center">
  <br>
  <img width="22" height="22" src="https://cloud.githubusercontent.com/assets/441546/25318539/db2f4cf2-2845-11e7-8e10-ef97d91cd538.png">
</p>
