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
 * Accepts a decorator descriptor object or a function that will be passed the
 * class being decorated and should return a decorator descriptor object. The
 * decorator descriptor object will be used decorate the original class thusly:
 *
 * - All properties/methods from its 'static' key will be copied to the
 *   decorated class as static properties/methods.
 * - All properties/methods from its 'prototype' key will be copied to the
 *   decorated class' prototype.
 * - When a new instance of the decorated class is constructed, its
 *   'onConstruct' method will be invoked with the new instance as its context,
 *   and will be passed any arguments provided to the original constructor.
 *
 * @param  {function|object} descriptorOrDescriptorFn
 * @return {function}
 */
export default function classDecoratorFactory(descriptorOrDescriptorFn) {
  return function (DecoratedClass, ...extraArgs) {
    let decoratorDescriptor;

    if (typeof DecoratedClass !== 'function' || extraArgs.length > 0) {
      throw new TypeError(`[ClassDecorator] Expected constructor function, got ${typeof DecoratedClass}`);
    }

    if (typeof descriptorOrDescriptorFn === 'function') {
      decoratorDescriptor = descriptorOrDescriptorFn(DecoratedClass);
    } else {
      decoratorDescriptor = descriptorOrDescriptorFn;
    }

    if (!isPlainObject(decoratorDescriptor)) {
      throw new TypeError(`[ClassDecorator] Expected decorator to be of type "Object", got "${typeof decoratorDescriptor}".`);
    }

    const {
      onConstruct,
      prototype,
      static: staticProps
    } = decoratorDescriptor;

    function ClassDecorator(...args) {
      // [1] Instantiate the decorated class using our context. We are allowed
      // to do this because we have set our prototype to the original
      // constructor's prototype.
      DecoratedClass.apply(this, args);

      // [2] Invoke the decorator's onConstruct method using our context and
      // forwarding any arguments we received.
      if (onConstruct && typeof onConstruct === 'function') {
        decoratorDescriptor.onConstruct.apply(this, args);
      }

      return this;
    }

    Object.defineProperty(ClassDecorator, 'name', {
      value: DecoratedClass.name
    });

    // Configure the delegate's prototype and constructor.
    ClassDecorator.prototype = DecoratedClass.prototype;
    ClassDecorator.prototype.constructor = DecoratedClass;

    // By default, we don't want to copy internal read-only properties,
    // constructors, or prototype references.
    const copyPredicate = (prop, dest) => !Reflect.ownKeys(dest).includes(prop);

    // [3] Apply prototype methods from decorator to decorated, but only if the
    // decorated class has not already defined them.
    if (prototype && isPlainObject(prototype)) {
      copyOwnProperties(DecoratedClass.prototype, prototype, copyPredicate);
    }

    // [4] Copy static properties / methods to the decorated constructor. This
    // must be done in order for them to be visible when traversing the
    // prototype chain.
    if (staticProps && isPlainObject(staticProps)) {
      copyOwnProperties(DecoratedClass, staticProps, copyPredicate);
    }

    // [5] Set up ClassDecorator to delegate to the decorated constructor,
    // thereby allowing consumers to access any static properties it or the
    // decorating class defined.
    Object.setPrototypeOf(ClassDecorator, DecoratedClass);

    return ClassDecorator;
  };
}
