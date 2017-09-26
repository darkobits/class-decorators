[![][travis-img]][travis-url] [![][npm-img]][npm-url] [![][codacy-img]][codacy-url] [![][xo-img]][xo-url] [![][cc-img]][cc-url]

# class-decorator

This package attempts to improve the way classes are decorated (see: [decorator proposal](https://ponyfoo.com/articles/javascript-decorators-proposal)) by not polluting the prototype chain, encouraging _composition over inheritance_.

## Installation

This package requires `babel-plugin-transform-decorators-legacy`.

```bash
$ yarn add -D babel-plugin-transform-decorators-legacy
$ yarn add @darkobits/class-decorator
```

or

```bash
$ npm install --save-dev babel-plugin-transform-decorators-legacy
$ npm install --save @darkobits/class-decorator
```

Then, update your `.babelrc` file:

```
{
  "plugins": ["transform-decorators-legacy"]
}
```

## Usage

#### `default(function: (class: decoratedClass): object): function`

This package's default export is a function that accepts a function that will be passed the original class (re: constructor function) being decorated and should return a decorator descriptor object. The decorator descriptor will be used to decorate the original class as follows:

1. All properties from its `static` key will be applied to the target class.
2. All properties from its `prototype` key will be applied to the target's prototype.
3. When a new instance is created, its `onConstruct` method will be invoked, provided any arguments passed to the original constructor, and bound to the new instance. (NB: Avoid defining `onConstruct` using an arrow function).

All of this is accomplished _without_ adding additional degrees of inheritance/delegation to the prototype chain.

**Example:**

In this example, we will create a higher-order decorator that accepts a list of superpowers to apply to class instances.

First, we will look at how this is done using the typical approach, then how to accomplish it using this package.

```js

function addSuperpowers (...powers) {
  return function (ctor) {
    return class AddSuperPowers extends ctor {
      constructor(...args) {
        super(...args);

        powers.forEach(power => {
          this[power] = true;
        });
      }

      hasSuperpower(power) {
        return this[power];
      }
    }
  };
}

@addSuperpowers('strength', 'speed', 'flight')
class Person {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

const bob = new Person('Bob');

bob.strength; //=> true
bob.speed; //=> true
bob.flight; //=> true
```

This is great, but if we examine the prototype chain of the `bob` instance, it will look something like this:

```
[this]
- name: 'Bob'
- strength: true
- speed: true
- flight: true
- [[Prototype]] => [AddSuperpowers]
                   - hasSuperpower()
                   - [[Prototype]] => [Person]
                                      - getName()
                                      - [[Prototype]] => Object
```

If we used 5 decorators on the `Person` class, we would find 5 degrees of inheritance added to each instance of `Person`. Decorators should faciliate _composition_, not exacerbate existing issues with inheritance. You might also notice that our decorator's prototype inherits from our original class, meaning that consumers of our decorator will not be able to shadow properties or methods applied by the decorator. This is bad behavior; the decorated class should always retain the ability to shadow properties set by ancestors _and_ decorators.

Let's see how with a few modifications we can improve this situation:

```js
import classDecorator from '@darkobits/class-decorator';

function addSuperpowers (...powers) {
  return classDecorator(() => ({
    onConstruct () {
      powers.forEach(power => {
        this[power] = true;
      });
    },
    prototype: {
      hasSuperpower (power) {
        return this[power];
      }
    }
  }));
}

@addSuperpowers('strength', 'speed', 'flight')
class Person {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

const bob = new Person('Bob');
```

If we looked at the protoype chain for this instance of `bob`, we would see:

```
[this]
- name: 'Bob'
- strength: true
- speed: true
- flight: true
- [[Prototype]] => [Person]
                   - getName()
                   - hasSuperpower()
                   - [[Prototype]] => Object
```

Class decorators that modify the original class rather than serving as syntactic sugar for more inheritance: :heart_eyes:

## &nbsp;
<p align="center">
  <br>
  <img width="22" height="22" src="https://cloud.githubusercontent.com/assets/441546/25318539/db2f4cf2-2845-11e7-8e10-ef97d91cd538.png">
</p>

[travis-img]: https://img.shields.io/travis/darkobits/class-decorator.svg?style=flat-square
[travis-url]: https://travis-ci.org/darkobits/class-decorator

[npm-img]: https://img.shields.io/npm/v/@darkobits/class-decorator.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@darkobits/class-decorator

[codacy-img]: https://img.shields.io/codacy/coverage/bd23f052d0ec42b0ada5e46b006e6511.svg?style=flat-square
[codacy-url]: https://www.codacy.com/app/darkobits/class-decorator

[xo-img]: https://img.shields.io/badge/code_style-XO-e271a5.svg?style=flat-square
[xo-url]: https://github.com/sindresorhus/xo

[cc-img]: https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square
[cc-url]: https://conventionalcommits.org/
