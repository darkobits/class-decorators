/**
 * Accepts a delegate function and returns a decorator.
 *
 * @param  {function} decorator - Function to invoke when new instances are created.
 * @return {function} - Class decorator.
 */
export default function createClassDecorator(delegate) {
  return function (ctor, ...args) {
    if (typeof ctor !== 'function' || args.length > 0) {
      throw new Error(`[createClassDecorator] Must be used on a class or constructor function, got: ${typeof ctor}`);
    }

    const decoratedCtor = new Function('delegate', 'ctor', `
      return function ${ctor.name} () {
        var args = Array.prototype.slice.call(arguments);
        return delegate.apply(this, [ctor.bind(this)].concat(args));
      }
    `)(delegate, ctor);

    decoratedCtor.prototype = ctor.prototype;

    return decoratedCtor;
  };
}
