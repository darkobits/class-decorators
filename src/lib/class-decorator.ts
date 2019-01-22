import ow from 'ow';
import {ClassDecoratorImplementation} from '../etc/types';


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
    // [Runtime] Ensure decorator was applied to a class.
    ow(Ctor, 'decorated class', ow.function);

    const decoratedCtor = decorator(Ctor);

    // If the decorator implementation did not return a function, return the
    // original constructor.
    if (!decoratedCtor || typeof decoratedCtor !== 'function') { // tslint:disable-line strict-type-predicates
      return Ctor;
    }

    // Otherwise, return a proxy constructor.
    const ProxyConstructor = function (...args: Array<any>) {
      const constructor = (...ctorArgs: Array<any>): void => {
        // TODO: Re-visit this once the decorators specification is finalized.
        try {
          // If transpiled to ES5, this method will work, and is cleaner.
          Reflect.apply(Ctor, this, ctorArgs);
        } catch {
          // If transpiled to ES6+, class constructors must be invoked with the
          // 'new' keyword, meaning we cannot call apply() on them. Although not
          // ideal, this method effectively maps any side effects from the
          // canonical constructor onto the current instance.
          Object.assign(this, Reflect.construct(Ctor, ctorArgs));
        }
      };

      return Reflect.apply(decoratedCtor, this, [{args, constructor}]);
    };

    // Ensures instanceof checks pass as expected.
    ProxyConstructor.prototype = Ctor.prototype;
    ProxyConstructor.prototype.constructor = Ctor;

    // Ensures static property delegation works as expected.
    Reflect.setPrototypeOf(ProxyConstructor, Ctor);

    // Ensures 'this.constructor.name' works as expected.
    Reflect.defineProperty(ProxyConstructor, 'name', {value: Ctor.name});

    return ProxyConstructor as unknown as typeof Ctor;
  };
}
