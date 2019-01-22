export interface GenericIndexableFunction {
  (...args: Array<any>): any;
  [index: string]: any;
}


// ----- Class Decorators ------------------------------------------------------

/**
 * This interface describes the shape of the object passed to class decorator
 * implementations.
 */
export interface ProxyConstructorOptions {
  constructor: (...ctorArgs: Array<any>) => void; // tslint:disable-line prefer-method-signature
  args: Array<any>;
}


/**
 * If the user decides to return a function from a class decorator (which will
 * serve as a proxy constructor) it should have this signature.
 */
export type ProxyConstructorImplementation = (opts: ProxyConstructorOptions) => void;


/**
 * Signature of the function provided to ClassDecorator, which may either return
 * nothing or return a proxy constructor.
 */
export type ClassDecoratorImplementation = (Ctor: GenericIndexableFunction) => ProxyConstructorImplementation | void;


// ----- Method Decorators -----------------------------------------------------

/**
 * This interface describes the shape of the object passed to method decorator
 * proxy functions.
 */
export interface ProxyMethodOptions {
  /**
   * Original, decorated method, pre-bound to the class instance.
   */
  method: Function;

  /**
   * Any arguments supplied to the method.
   */
  args: Array<any>;

  /**
   * Class instance. Use of this is only requred if the proxy method is
   * implemented as an arrow function.
   */
  instance: any;
}


/**
 * If the user decides to return a function from a method decorator, it should
 * have this signature.
 */
export type ProxyMethodImplementation = (opts: ProxyMethodOptions) => any;


/**
 * This interface describes the shape of the object passed to method decorator
 * implementations.
 */
export interface MethodDecoratorOptions {
  /**
   * Note: 'any' is used here to prevent the type-checker from complaining if
   * the user tries to assign a Symbol to the prototype.
   *
   * See: https://github.com/Microsoft/TypeScript/issues/1863
   */
  prototype: any;

  /**
   * Name of the method being decorated.
   */
  methodName: string;

  /**
   * Property descriptor for the method being decorated.
   */
  descriptor: PropertyDescriptor;
}


/**
 * Describes the signature of the function that users shoud provide to method
 * decorators.
 */
export type MethodDecoratorImplementation = (opts: MethodDecoratorOptions) => ProxyMethodImplementation | void;
