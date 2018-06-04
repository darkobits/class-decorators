import ow from 'ow';


/**
 * This interface describes the shape of the object passed to method decorator
 * implementations.
 */
export interface IDecoratedMethodOptions {
  // Original, decorated method, pre-bound to the class instance.
  method: Function;
  // Name of the original method.
  methodName: string;
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

  return (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const method = descriptor && descriptor.value;

    // [Runtime] Ensure we were applied to a method.
    ow(method, ow.function.label('decorated method'));

    descriptor.value = function (...args: Array<any>) {
      return Reflect.apply(decorator, this, [{args, method: method.bind(this), methodName: key} as IDecoratedMethodOptions]);
    };

    return descriptor;
  };
}
