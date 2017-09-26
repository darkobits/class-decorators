import isPlainObject from 'is-plain-object';

/**
 * @private
 *
 * Copies all own properties of 'src' to 'dest'. If an optional predicate is
 * provided, the property will only be copied if the predicate returns true.
 *
 * @param  {object} dest
 * @param  {object} src
 * @param  {function} [predicate]
 */
function copyOwnProperties(dest, src, predicate) {
  Object.getOwnPropertyNames(src).forEach(prop => {
    if (typeof predicate === 'function' && !predicate(prop, dest, src)) {
      return;
    }

    dest[prop] = src[prop];
  });
}

/**
 * Accepts a function that, when invoked, will be passed the class constructor
 * being decorated and should return an object. The returned object will be used
 * to decorate the original class thusly:
 *
 * - All properties/methods from its 'static' key will be copied to the
 *   decorated class as static properties/methods.
 * - All properties/methods from its 'prototype' key will be copied to the
 *   decorated class' prototype.
 * - When a new instance of the decorated class is constructed, its
 *   'onConstruct' method will be invoked with the new instance as its context,
 *   and will be passed any arguments provided to the original constructor.
 *
 * @param  {function} getDecorator
 * @return {function}
 */
export default function classDecoratorFactory(getDecorator) {
  return function (Ctor, ...extraArgs) {
    if (typeof Ctor !== 'function' || extraArgs.length > 0) {
      throw new TypeError(`[ClassDecorator] Expected constructor function, got ${typeof Ctor}`);
    }

    const Decorator = getDecorator(Ctor);

    if (!isPlainObject(Decorator)) {
      throw new TypeError(`[ClassDecorator] Expected decorator to be of type "Object", got "${typeof Decorator}".`);
    }

    function ClassDecorator(...args) {
      // [1] Instantiate the decorated class using our context. We are allowed
      // to do this because we have set our prototype to the original
      // constructor's prototype.
      Ctor.apply(this, args);

      // [2] Invoke the decorator's "constructor" method using our context and
      // forwarding any arguments we received.
      if (Decorator.onConstruct && typeof Decorator.onConstruct === 'function') {
        Decorator.onConstruct.apply(this, args);
      }

      return this;
    }

    // Configure the delegate's prototype and constructor.
    ClassDecorator.prototype = Ctor.prototype;
    ClassDecorator.prototype.constructor = Ctor;

    // By default, we don't want to copy internal read-only properties,
    // constructors, or prototype references.
    const copyPredicate = (prop, dest) => !Reflect.ownKeys(dest).includes(prop);

    // [3] Apply prototype methods from decorator to decorated, but only if the
    // decorated class has not already defined them.
    if (Decorator.prototype && isPlainObject(Decorator.prototype)) {
      copyOwnProperties(Ctor.prototype, Decorator.prototype, copyPredicate);
    }

    // [4] Copy static properties / methods to the decorated constructor. This
    // must be done in order for them to be visible when traversing the
    // prototype chain.
    if (Decorator.static && isPlainObject(Decorator.static)) {
      copyOwnProperties(Ctor, Decorator.static, copyPredicate);
    }

    // [5] Set up ClassDecorator to delegate to the decorated constructor,
    // thereby allowing consumers to access any static properties it or the
    // decorating class defined.
    Object.setPrototypeOf(ClassDecorator, Ctor);

    return ClassDecorator;
  };
}
