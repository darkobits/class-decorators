/**
 * Set's the 'name' property of the provided function to the provided value, and
 * performs some minor indirection so that environments like Chrome, which
 * perform an obnoxious amount of static analysis of code to try and report a
 * function's name using the name of the variable or object key it was assigned
 * to rather than simply reading from the function's 'name' property... will be
 * forced to read it's 'name' property.
 */
export function createFunctionWithName(name: string, fn: Function): typeof fn {
  Reflect.defineProperty(fn, 'name', {value: name});
  return [fn][0];
}


/**
 * If provided an object, returns the object. If provided a class (function),
 * returns its 'prototype' property. This allows us to accept either a class or
 * its prototype object and resolve to its prototype object.
 */
export function normalizePrototype(value: object | Function): object {
  if (typeof value === 'function') {
    return value.prototype;
  }

  return value;
}


/**
 * Provided an object or class, returns the last object in its prototype chain
 * before the root prototype (re: Object.prototype). In other words, the last
 * meaningful prototype in its chain.
 */
export function getPenultimatePrototype(protoOrClass: object | Function): object {
  const proto = normalizePrototype(protoOrClass);
  const parentProto = Reflect.getPrototypeOf(proto);

  if (parentProto === Object.prototype) {
    return proto;
  }

  return getPenultimatePrototype(parentProto);
}


/**
 * Provided an object or class, traverses up its prototype chain until we reach
 * an object whose prototype is equal to the "stop at exclusive" object or class
 * provided, then returns the prototype that points to it.
 *
 * If we reach Object.prototype without encountering the 'stop at' prototype,
 * undefined is returned.
 */
export function findLastPrototypeBefore(protoOrClass: object | Function, stopAtExclusiveProtoOrClass: object | Function): object | void {
  const proto = normalizePrototype(protoOrClass);

  if (proto === Object.prototype) {
    return;
  }

  const parentProto = Reflect.getPrototypeOf(proto);
  const stopAtExclusiveProto = normalizePrototype(stopAtExclusiveProtoOrClass);

  if (parentProto === stopAtExclusiveProto) {
    return proto;
  }

  return findLastPrototypeBefore(parentProto, stopAtExclusiveProto);
}


/**
 * Creates a new object with all the own properties of the provided object and
 * which delegates to the same object as the source object.
 */
export function clonePrototype(from: object, to: object = Object.create(Reflect.getPrototypeOf(from))) {
  const properties = Object.getOwnPropertyNames(from);

  properties.forEach(propertyName => {
    const fromValue = Reflect.getOwnPropertyDescriptor(from, propertyName);
    let toValue: any;

    if (fromValue) {
      toValue = fromValue.value;
    }

    Reflect.defineProperty(to, propertyName, {
      value: toValue,
      writable: true,
      enumerable: false,
      configurable: true
    });
  });

  return to;
}


/**
 * Deletes all own properties of the provided object.
 */
export function emptyObjectInPlace(value: object) {
  const properties = Object.getOwnPropertyNames(value);

  properties.forEach(propertyName => {
    Reflect.deleteProperty(value, propertyName);
  });
}


/**
 * Updates the prototype of 'subject' to 'newProto', saving subject's original
 * prototype. Returns a function that, when invoked, will restore subject's
 * prototype to its original value.
 */
export function setPrototypeOfWithRestore(subject: object, newProto: object): Function {
  const restoreToPrototype = Reflect.getPrototypeOf(subject);

  const updateResult = Reflect.setPrototypeOf(subject, newProto);

  if (!updateResult) {
    throw new Error('Failed to update prototype; cyclic chain would result.');
  }

  return () => {
    const restoreResult = Reflect.setPrototypeOf(subject, restoreToPrototype);

    if (!restoreResult) {
      throw new Error('Failed to restore prototype; cyclic chain would result.');
    }
  };
}


/**
 * Temporarily modifies the prototype chain of 'base' such that in addition to
 * delegating to its existing prototype chain, it will also delegate to the
 * prototype chain of 'extension'. This is achieved by inserting the prototype
 * chain of 'extension' into the prototype chain of 'base' just before its
 * termination at the root prototype. Then, the provided callback is executed.
 * Once it returns, the prototype chain of 'base' is restored to its original
 * state.
 *
 * In the event that 'extension' contains 'base' in its prototype chain, we only
 * apply the segment of 'extension's prototype chain leading up to but not
 * including 'base', thereby avoiding a cyclic chain.
 */
export function withPrototypeExtension(baseProtoOrClass: object | Function, extensionProtoOrClass: object | Function, cb: Function) {
  // Normalize first parameter.
  const beginningOfBase = normalizePrototype(baseProtoOrClass);
  // Normalize second parameter.
  const beginningOfExtension = normalizePrototype(extensionProtoOrClass);

  // Find the object in our extension chain that points to 'beginningOfBase',
  // keeping in mind that the extension chain is a superset of the base chain.
  const extensionProtoThatLinksToEmptyBase = findLastPrototypeBefore(beginningOfExtension, beginningOfBase);

  if (!extensionProtoThatLinksToEmptyBase) {
    // If extension never links to base, we can safely assume that the current
    // constructor call is not coming from a decorated class, and therefore the
    // constructor's view of the prototype chain is accurate, and we can exit
    // early.
    cb();
    return;
  }

  // Create a new surrogate prototype object with all of the properties of the
  // original base prototype and shares the same parent prototype. We must
  // create this object so we can avoid === checks later on that would prevent
  // us from manipulating the prototype chain.
  const baseClone = clonePrototype(beginningOfBase);

  // Now, empty-out the first object in the base chain. We have to do this
  // in-place because we cannot control the value of the object, only its
  // contents. We will insert its clone we created above into the correct place
  // in the prototype chain below.
  emptyObjectInPlace(beginningOfBase);

  // At the point in the extention (re: superset) chain that used to point to
  // our base object, point to our cloned base object that shares the same
  // parent and will thus continue the chain as expected.
  const restoreExtensionThatLinksToBase = setPrototypeOfWithRestore(extensionProtoThatLinksToEmptyBase, baseClone);

  // Finally, point our empty base object to the beginning of the extension
  // chain. What we have now constructed is a chain that looks exactly like it
  // should, with the exception of the extra empty base object at the beginning.
  const restoreBase = setPrototypeOfWithRestore(beginningOfBase, beginningOfExtension);

  // Call the provided callback.
  cb();

  // Copy all properties on our cloned base object back onto the original base.
  clonePrototype(baseClone, beginningOfBase);

  // Call our restore functions to restore prototype links to their original
  // state.
  restoreBase();
  restoreExtensionThatLinksToBase();
}
