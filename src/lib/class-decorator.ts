import ow from 'ow';


/**
 * This interface describes the shape of the object passed to class decorator
 * implementations.
 */
export interface IDecoratedConstructorOptions {
  constructor: Function;
  args: Array<any>;
}


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
export default function ClassDecoratorFactory(decorator: Function): Function {
  // [Runtime] Ensure we were provided a function.
  ow(decorator, ow.function.label('decorator implementation'));

  return (Ctor: Function): Function => {
    // [Runtime] Ensure decorator was applied to a class.
    ow(Ctor, ow.function.label('decorated class'));

    const decoratedCtor: Function = decorator(Ctor);

    // If the decorator implementation did not return a function, return the
    // original constructor.
    if (!ow.isValid(decoratedCtor, ow.function)) {
      return Ctor;
    }

    // Otherwise, return a proxy constructor.
    function ProxyConstructor(...args: Array<any>) {
      const constructor = (...ctorArgs: Array<any>): void => {
        Reflect.apply(Ctor, this, ctorArgs);
      };

      return Reflect.apply(decoratedCtor, this, [{args, constructor} as IDecoratedConstructorOptions]);
    }

    // Ensures instanceof checks pass as expected.
    ProxyConstructor.prototype = Ctor.prototype;
    ProxyConstructor.prototype.constructor = Ctor;

    // Ensures static property delegation works as expected.
    Reflect.setPrototypeOf(ProxyConstructor, Ctor);

    // Ensures 'this.constructor.name' works as expected.
    Reflect.defineProperty(ProxyConstructor, 'name', {value: Ctor.name});

    return ProxyConstructor;
  };
}
