import chalk from 'chalk';
// @ts-ignore
import convertHrtime from 'convert-hrtime';


/**
 * Set's the 'name' property of the provided function to the provided value, and
 * performs some minor indirection so that environments like Chrome, which
 * perform an obnoxious amount of static analysis of your code to try and report
 * a function's name using the name of the variable or object key it was
 * assigned to rather than simply reading from the function's 'name' property...
 * will be forced to read it's 'name' property.
 */
export function createFunctionWithName(name: string, fn: Function): typeof fn {
  Reflect.defineProperty(fn, 'name', {value: name});
  return [fn][0];
}


/**
 * If provided an object, returns the object. If provided a class (function),
 * returns its 'prototype' property.
 */
function getPrototypeOf(value: object | Function) {
  if (typeof value === 'function') {
    return value.prototype;
  }

  return value;
}


/**
 * Provided an object or class, returns the last object in its prototype chain
 * before the root prototype (re: Object.prototype). In other words, the last
 * meaningful object in its chain.
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
 * provided.
 */
function findLastPrototypeBefore(protoOrClass: object | Function, stopAtExclusiveProtoOrClass: object | Function) {
  const proto = getPrototypeOf(protoOrClass);
  const stopAtExclusiveProto = getPrototypeOf(stopAtExclusiveProtoOrClass);

  if (Reflect.getPrototypeOf(proto) === stopAtExclusiveProto) {
    return proto;
  }
}


/**
 * Temporarily modifies the prototype chain of "base" such that in addition to
 * delegating to its existing prototype chain, it will also delegate to the
 * prototype chain of "extension". This is achieved by inserting the prototype
 * chain of "extension" into the prototype chain of "base" just before its
 * termination at the root prototype. Then, the provided callback is executed.
 * Once it returns, the prototype chain of "base" is restored to its original
 * state.
 *
 * In the event that "extension" contains "base" in its prototype chain, we only
 * apply the segment of "extension"s prototype chain leading up to but not
 * including "base", thereby avoiding a cyclic chain.
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

  // If base's chain exists in extension's chain,
  if (lastProtoBeforeCyclic) {
    Reflect.setPrototypeOf(lastProtoBeforeCyclic, Object.prototype);
  }

  Reflect.setPrototypeOf(basePenultimatePrototype, extension);

  cb();

  Reflect.setPrototypeOf(basePenultimatePrototype, Object.prototype);

  if (lastProtoBeforeCyclic) {
    Reflect.setPrototypeOf(lastProtoBeforeCyclic, base);
  }
}


/**
 * Provided two numbers, returns a string describing the relative difference
 * between them.
 */
export function relativeRate(a: number, b: number): string {
  if (a === b) {
    return 'equal';
  }

  const descriptor = b > a ? 'faster' : 'slower';
  const rate = b > a ? b / a : a / b;

  return `${rate.toFixed(2)}x ${descriptor}`;
}


export interface TestOptions {
  n: number;
  label: string;
  baseTime?: number;
}


/**
 * Used by perf.ts to run performance tests.
 */
export function doTest({n, label, baseTime}: TestOptions, fn: Function) {
  const startTime = process.hrtime();

  for (let i = 0; i < n; i++) {
    fn();
  }

  const {milliseconds} = convertHrtime(process.hrtime(startTime));

  if (process.env.NODE_ENV !== 'test') {
    if (baseTime) {
      const relative = relativeRate(milliseconds, baseTime);
      console.log(`Test: ${chalk.green.bold(label)}\n  N:\t${chalk.yellow(n.toLocaleString())}\n  Time:\t${chalk.yellow(`${milliseconds.toFixed(2)}ms`)} (${relative}).\n`);
    } else {
      console.log(`Test: ${chalk.green.bold(label)}\n  N:\t${chalk.yellow(n.toLocaleString())}\n  Time:\t${chalk.yellow(`${milliseconds.toFixed(2)}ms`)}.\n`);
    }
  }

  return milliseconds;
}
