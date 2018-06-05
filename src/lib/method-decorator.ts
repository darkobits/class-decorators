import ow from 'ow';


/**
 * This interface describes the shape of the object passed to method decorator
 * implementations.
 */
export interface IMethodDecoratorOptions {
  prototype: object;
  methodName: string;
  descriptor: PropertyDescriptor;
}


/**
 * This interface describes the shape of the object passed to method decorator
 * proxy functions.
 */
export interface IMethodProxyOptions {
  // Original, decorated method, pre-bound to the class instance.
  method: Function;
  // Any arguments supplied to the method.
  args: Array<any>;
}


/**
 * Provided a decorator implementation function, returns a decorator that may be
 * applied to class methods.
 *
 * The decorator implementation function will be invoked each time the method is
 * called, and is passed an IMethodDecoratorOptions object.
 */
export default function ClassMethodDecoratorFactory(decorator: Function): Function {
  // [Runtime] Ensure we were provided a function.
  ow(decorator, ow.function.label('decorator implementation'));

  return (prototype: object, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const method = descriptor && descriptor.value;

    // [Runtime] Ensure we were applied to a method.
    ow(method, ow.function.label('decorated method'));

    const proxyMethod: Function = decorator({prototype, methodName, descriptor} as IMethodDecoratorOptions);

    // If the decorator implementation function returned a function, set up
    // method delegation to the returned function.
    if (ow.isValid(proxyMethod, ow.function)) {
      descriptor.value = function (...args: Array<any>) {
        return Reflect.apply(proxyMethod, this, [{args, method: method.bind(this)} as IMethodProxyOptions]);
      };
    }

    return descriptor;
  };
}
