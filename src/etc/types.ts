/**
 * This interface describes the shape of the object passed to class decorator
 * implementations.
 */
export interface IDecoratedConstructorOptions {
  constructor: Function;
  args: Array<any>;
}


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
  // Class instance.
  instance: any;
}
