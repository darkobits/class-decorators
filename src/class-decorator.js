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
 * being decorated and should return a class. The returned class will be used
 * to decorate the original class thusly:
 *
 * - All static properties will be copied to the decorated class.
 * - All prototype methods will be copied to the decorated class' prototype.
 * - Any instance properties it creates will be copied to the decorated class.
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

    if (typeof Decorator !== 'function') {
      throw new TypeError(`[ClassDecorator] Expected decorator to be a class or function, got "${typeof Decorator}".`);
    }

    function ClassDecorator(...args) {
      // [1] Instantiate the decorator class and copy any instance properties
      // it creates to the local context.
      copyOwnProperties(this, new Decorator(...args));

      // [2] Instantiate the decorated class and copy and instance properties
      // it creates to the local context.
      copyOwnProperties(this, new Ctor(...args));
    }

    // Configure the delegate's prototype and constructor.
    ClassDecorator.prototype = Ctor.prototype;
    ClassDecorator.prototype.constructor = Ctor;

    // By default, we don't want to copy internal read-only properties,
    // constructors, or prototype references.
    const copyPredicate = (prop, dest) => !Reflect.ownKeys(dest).includes(prop);

    // [3] Apply prototype methods from decorator to decorated, but only if the
    // decorated class has not already defined them.
    copyOwnProperties(
      Ctor.prototype,
      Decorator.prototype,
      copyPredicate,
      'Decorator Prototype => Decorated Prototype'
    );

    // [4] Copy static properties / methods to the decorated constructor. This
    // must be done in order for them to be visible when traversing the
    // prototype chain.
    copyOwnProperties(
      Ctor,
      Decorator,
      copyPredicate,
      'Decorator Statics => Decorated Statics'
    );

    // [5] Set up ClassDecorator to delegate to the decorated constructor,
    // thereby allowing consumers to access any static properties it or the
    // decorating class defined.
    Object.setPrototypeOf(ClassDecorator, Ctor);

    return ClassDecorator;
  };
}
