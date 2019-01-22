import {path} from 'ramda';

import ClassDecorator from './class-decorator';


const STATIC_PROPERTY = 'STATIC_PROPERTY';
const INHERITED_PROPERTY = 'INHERITED_PROPERTY';
const OWN_PROPERTY = 'OWN_PROPERTY';
const PROTO_PROPERTY = 'PROTO_PROPERTY';
const DECORATOR_OWN_PROPERTY = 'DECORATOR_OWN_PROPERTY';


// ----- Test Decorators -------------------------------------------------------

const StaticPropertyDecorator = ClassDecorator(Class => {
  Class[STATIC_PROPERTY] = STATIC_PROPERTY;
});

const ProtoDecorator = ClassDecorator(Class => {
  Class.prototype[PROTO_PROPERTY] = PROTO_PROPERTY;
});

const ConstructorDecorator = ClassDecorator(() => {
  return function ({constructor, args}) {
    this[DECORATOR_OWN_PROPERTY] = DECORATOR_OWN_PROPERTY;
    constructor(...args);
  };
});


// ----- Test Classes ----------------------------------------------------------

class SuperSubject { // tslint:disable-line no-unnecessary-class
  [index: string]: any;

  static STATIC_PROPERTY: any;

  constructor() {
    this[INHERITED_PROPERTY] = INHERITED_PROPERTY;
  }
}


@StaticPropertyDecorator
@ProtoDecorator
@ConstructorDecorator
class Subject extends SuperSubject {
  constructor() {
    super();
    this[OWN_PROPERTY] = OWN_PROPERTY;
  }
}


describe('ClassDecorator', () => {
  describe('Reflect.apply() method', () => {
    let instance: any;

    beforeEach(() => {
      instance = new Subject();
    });

    it('should have a static member', () => {
      expect(Subject[STATIC_PROPERTY]).toBe(STATIC_PROPERTY);
    });

    it('should have an inherited member', () => {
      expect(instance[INHERITED_PROPERTY]).toBe(INHERITED_PROPERTY);
    });

    it('should have an own member', () => {
      expect(instance[OWN_PROPERTY]).toBe(OWN_PROPERTY);
    });

    it('should have a prototype member', () => {
      expect(instance[PROTO_PROPERTY]).toBe(PROTO_PROPERTY);
    });

    it('should have a member set by the decorated constructor', () => {
      expect(instance[DECORATOR_OWN_PROPERTY]).toBe(DECORATOR_OWN_PROPERTY);
    });

    it('should pass instanceof checks', () => {
      expect(instance instanceof Subject).toBe(true);
      expect(instance instanceof SuperSubject).toBe(true);
    });

    it('should pass name checks', () => {
      expect(instance.constructor.name).toBe(Subject.name);
    });

    it('should throw an error when not used on a class', () => {
      // @ts-ignore
      expect(() => ConstructorDecorator(undefined)).toThrow('Expected `decorated class` to be of type `Function` but received type `undefined`');
    });
  });

  describe('Object.assign() method', () => {
    let instance: any;
    let oApply: any;
    let oAssign: any;

    beforeAll(() => {
      oAssign = Object.assign;
      oApply = Reflect.apply;

      Reflect.apply = jest.fn((target, context, args) => {
        // Throw an error if Reflect.apply() was passed our test class,
        // simulating what would happen in an ES6+ runtime.
        if (target.name === Subject.name) {
          throw new Error('nope');
        }

        return oApply(target, context, args);
      });

      Object.assign = jest.fn((objA, objB) => oAssign(objA, objB)); // tslint:disable-line no-unnecessary-callback-wrapper

      instance = new Subject();
    });

    it('should use the Object.assign fallback method', () => {
      // Assert that Object.assign was called
      expect(Object.assign).toHaveBeenCalled();

      // Assert that Object.assign was called with two objects that were both
      // valid instances of our test class.
      expect(path(['assign', 'mock', 'calls', 0, 0], Object) instanceof Subject).toBe(true);
      expect(path(['assign', 'mock', 'calls', 0, 1], Object) instanceof Subject).toBe(true);
    });

    // Assert that instances created using the Object.assign() method have the
    // same properties as ones created using the Reflect.apply() method.

    it('should have a static member', () => {
      expect(Subject[STATIC_PROPERTY]).toBe(STATIC_PROPERTY);
    });

    it('should have an inherited member', () => {
      expect(instance[INHERITED_PROPERTY]).toBe(INHERITED_PROPERTY);
    });

    it('should have an own member', () => {
      expect(instance[OWN_PROPERTY]).toBe(OWN_PROPERTY);
    });

    it('should have a prototype member', () => {
      expect(instance[PROTO_PROPERTY]).toBe(PROTO_PROPERTY);
    });

    it('should have a member set by the decorated constructor', () => {
      expect(instance[DECORATOR_OWN_PROPERTY]).toBe(DECORATOR_OWN_PROPERTY);
    });

    it('should pass instanceof checks', () => {
      expect(instance instanceof Subject).toBe(true);
      expect(instance instanceof SuperSubject).toBe(true);
    });

    it('should pass name checks', () => {
      expect(instance.constructor.name).toBe(Subject.name);
    });

    afterAll(() => {
      Reflect.apply = oApply;
      Object.assign = oAssign;
    });
  });
});
