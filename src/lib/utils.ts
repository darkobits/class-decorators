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
 * returns its 'prototype' property. This allows us to 'normalize' classes and
 * prototype objects to prototype objects.
 */
function getPrototypeOf(value: object | Function): object {
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
function getPenultimatePrototype(protoOrClass: object | Function): object {
  const proto = getPrototypeOf(protoOrClass);
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
function findLastPrototypeBefore(protoOrClass: object | Function, stopAtExclusiveProtoOrClass: object | Function): object | void {
  const proto = getPrototypeOf(protoOrClass);

  if (proto === Object.prototype) {
    return;
  }

  const parentProto = Reflect.getPrototypeOf(proto);
  const stopAtExclusiveProto = getPrototypeOf(stopAtExclusiveProtoOrClass);

  if (parentProto === stopAtExclusiveProto) {
    return proto;
  }

  return findLastPrototypeBefore(parentProto, stopAtExclusiveProto);
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
  const base = getPrototypeOf(baseProtoOrClass);
  const extension = getPrototypeOf(extensionProtoOrClass);

  // Find the last "meaningful" prototype object in base's chain before the root
  // prototype.
  const basePenultimatePrototype = getPenultimatePrototype(base);

  // Since it may be possible that base's chain is already included in
  // extension's chain, find the last prototype object in extension's chain
  // before base's prototype.
  const lastProtoBeforeCyclic = findLastPrototypeBefore(extension, base);

  // If base's chain exists in extension's chain, we cannot append extension to
  // base without resulting in a cyclic chain. To avoid this, we temporarily
  // terminate extension's chain at base by pointing to Object.prototype.
  if (lastProtoBeforeCyclic) {
    Reflect.setPrototypeOf(lastProtoBeforeCyclic, Object.prototype);
  }

  // Extend base's chain to include extension's by inserting it at the end of
  // base's chain.
  Reflect.setPrototypeOf(basePenultimatePrototype, extension);

  // ... profit?
  cb();

  // Reset base's chain to terminate at Object.prototype.
  Reflect.setPrototypeOf(basePenultimatePrototype, Object.prototype);

  // If extension's chain was truncated, restore it.
  if (lastProtoBeforeCyclic) {
    Reflect.setPrototypeOf(lastProtoBeforeCyclic, base);
  }
}
