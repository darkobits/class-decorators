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

    return class ClassDecorator extends Ctor {
      constructor(...args: Array<any>) {
        super(...args);

        const options = Object.assign(Object.create(null), { // tslint:disable-line no-null-keyword
          args,
          context: this
        });

        // @ts-ignore
        Reflect.apply(decoratedCtor, this, [options]);
      }
    };
  };
}
