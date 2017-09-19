[![][travis-img]][travis-url] [![][npm-img]][npm-url] [![][codacy-img]][codacy-url] [![][xo-img]][xo-url] [![][cc-img]][cc-url]

# class-decorator

This package attempts to improve upon the base [decorator proposal](https://ponyfoo.com/articles/javascript-decorators-proposal), specifically when decorating classes, by:

- Preserving the constructor's `name` and not adding to the prototype chain.
- Allowing decorators to manipulate the newly created class instance.

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

#### `createClassDecorator(function: delegate): function`

`createClassDecorator` accepts a delegate function and returns a decorator that may be applied to a class or constructor function. The delegate function will be invoked with the following parameters:

|Name|Type|Description|
|---|---|---|
|`ctor`|`function`|Original class constructor, already bound to the newly created class instance.|
|`args`|`arglist`|Arguments that were passed to the constructor.|

Additionally, the delegate function itself will be bound to the newly created class instance. For this reason, arrow functions should be avoided if modifying the instnace object is desired.

The delegate function is responsible for invoking the original constructor (or not) and for forwarding original constructor arguments (or not).

**Example:**

In this example, we will create a higher-order decorator that accepts a list of superpowers to apply to class instances.

```js
import createClassDecorator from '@darkobits/class-decorator';

function addSuperpowers (...powers) {
  return createClassDecorator(function (ctor, ...args) {
    powers.forEach(power => {
      this[power] = true;
    });

    return ctor(...args);
  });
}

@addSuperpowers('strength', 'speed', 'flight')
class Person {

}

const bob = new Person();

bob.strength; //=> true
bob.speed; //=> true
bob.flight; //=> true
bob.constructor.name; //=> 'Person'
```

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
