import ow from 'ow';
import {GenericIndexableFunction, MethodDecoratorImplementation} from './etc/types';


/**
 * Provided a decorator implementation function, returns a decorator that may be
 * applied to class methods.
 *
 * The decorator implementation function will be invoked each time the method is
 * called, and is passed an MethodDecoratorOptions object.
 */
export default function ClassMethodDecoratorFactory(decorator: MethodDecoratorImplementation) {
  // [Runtime] Ensure we were provided a function.
  ow(decorator, 'decorator implementation', ow.function);

  return (prototype: object, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const method = descriptor && descriptor.value as GenericIndexableFunction;

    // [Runtime] Ensure we were applied to a method.
    ow(method, 'decorated method', ow.function);

    const proxyMethod = decorator({prototype, methodName, descriptor});

    // If the decorator implementation function returned a function, set up
    // method delegation to the returned function.
    if (typeof proxyMethod === 'function') {
      descriptor.value = function (...args: Array<any>) {
        return Reflect.apply(proxyMethod, this, [{
          args,
          method: method.bind(this),
          instance: this
        }]);
      };
    }

    return descriptor;
  };
}
