import ow from 'ow';
import {ClassDecoratorImplementation} from './etc/types';
import {createFunctionWithName, withPrototypeExtension} from 'lib/utils';


/**
 * Provided a decorator implementation function, returns a decorator that may be
 * applied to a class.
 *
 * The decorator implementation function is passed 1 argument: the class being
 * decorated (re: its constructor).
 *
 * If the decorator implementation function returns a function, it will be used
 * as a proxy for the original constructor. The proxy constructor will be
 * invoked with an IDecoratedConstructorOptions object.
 */
export default function ClassDecoratorFactory(decorator: ClassDecoratorImplementation) {
  // [Runtime] Ensure we were provided a function.
  ow(decorator, 'decorator implementation', ow.function);

  return (Ctor: any): typeof Ctor => {
    // [Runtime] Ensure decorator was applied to a class (re: function).
    ow(Ctor, 'decorated class', ow.function);

    const decoratedCtor = decorator(Ctor);

    // If anything other than a function was returned, then return the original
    // class.
    if (typeof decoratedCtor !== 'function') {
      return Ctor;
    }

    // Ensures 'this.constructor.name' works as expected.
    const ProxyConstructor = createFunctionWithName(Ctor.name, function (...args: Array<any>): any {
      // Get the prototype of the last constructor in the chain so that when we
      // extend Ctor's prototype chain (below) we capture any prototypes of
      // subclasses.
      const BasePrototype = this.constructor.prototype;

      const options = Object.create(null); // tslint:disable-line no-null-keyword

      options.args = args;

      options.context = this;

      /**
       * A Brief Explanation of What the **** Is Going On Here:
       *
       * After much toil it was determined that due to the very strict way
       * classes are implemented in ES6 (re: when the runtime supports them
       * natively, not when they are transpiled into ES5 constructor functions)
       * it is literally impossible to invoke a class' constructor (function)
       * without the 'new' keyword, which will always create a new object and
       * pass it to the invocation as its 'this' binding. This presents a
       * problem for us here because we need to provide our local 'this' to the
       * constructor call in order to ensure that the constructor can "see"
       * everything the user would expect it to be able to see.
       *
       * Under normal circumstances, this constructor call should be able to
       * see the entire prototype chain. If this call is a super call (ie:
       * we are actually instantiating some child/descendant of this class)
       * then the constructor should be able to see any prototype properties
       * set by its children. However, because we are forced to call it directly
       * rather than as a super call, everything below it in the prototype chain
       * is now lost -- that information is on our local 'this' but not the
       * object created by 'new'.
       *
       * So, how do we provide the constructor with the view of the world it
       * needs when we have no control over its 'this' binding?
       *
       * While we can't control it's 'this', we *can* control the objects in the
       * constructor's prototype chain that its 'this' will delegate to, and
       * that's what we're doing here; we are temporarily inserting the
       * prototype chain of ProxyConstructor (that contains all the information
       * that the constructor *should* be able to see but can't) at the end of
       * the constructor's prototype chain just before the root prototype
       * (Object.prototype). While in this state, we make the constructor call,
       * then revert the chain to its original state. This way, we are able to
       * satisfy the (absolutely ridiculous) constraint that we use 'new' (or
       * Reflect.construct) while also ensuring that everything works as
       * expected.
       *
       * Should you use this in production environments where you're creating
       * millions of objects in short periods of time?
       *
       * Probably not.
       *
       * Can you use this in production environments where you're creating
       * several dozens or even hundreds of objects?
       *
       * Yeah; the performance implictions are, as Crockford would say, "in the
       * noise" at that point.
       *
       * P.S. Note that this shenanigannery *only* takes place if the decorator
       * returned a proxy constructor *and* that proxy constructor winds up
       * invoking the original constructor.
       */
      options.constructor = (...argsFromDecoratedCtor: Array<any>) => {
        withPrototypeExtension(Ctor, BasePrototype, () => {
          const orphanInstance = Reflect.construct(Ctor, argsFromDecoratedCtor);
          Object.assign(this, orphanInstance);

          if (Ctor.prototype !== BasePrototype) {
            Reflect.setPrototypeOf(orphanInstance, BasePrototype);
            Reflect.setPrototypeOf(this, Reflect.getPrototypeOf(orphanInstance));
          }
        });
      };

      Reflect.apply(decoratedCtor, this, [options]);
    });

    // Ensures proper delegation of prototype properties and ensures instanceof
    // checks pass as expected.
    ProxyConstructor.prototype = Ctor.prototype;

    // Ensures static property delegation works as expected.
    Reflect.setPrototypeOf(ProxyConstructor, Ctor);

    return ProxyConstructor as typeof Ctor;
  };
}
