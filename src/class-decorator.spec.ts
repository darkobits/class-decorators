import ClassDecorator from './class-decorator';


const STATIC_PROPERTY_VIA_DECORATOR = 'STATIC_PROPERTY_VIA_DECORATOR';
const STATIC_PROPERTY = 'STATIC_PROPERTY';
const INHERITED_PROPERTY = 'INHERITED_PROPERTY';
const OWN_PROPERTY = 'OWN_PROPERTY';
const PROTO_PROPERTY = 'PROTO_PROPERTY';
const DECORATOR_OWN_PROPERTY = 'DECORATOR_OWN_PROPERTY';
const CHILD_PROTO_PROPERTY = 'CHILD_PROTO_PROPERTY';


// ----- Test Decorators -------------------------------------------------------

const StaticPropertyDecorator = ClassDecorator(Class => {
  Class[STATIC_PROPERTY_VIA_DECORATOR] = STATIC_PROPERTY_VIA_DECORATOR;
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


// ----- GrandParent -----------------------------------------------------------

class GrandParent { // tslint:disable-line no-unnecessary-class
  [index: string]: any;

  static STATIC_PROPERTY_VIA_DECORATOR: any;

  constructor() {
    // While not a proper assertion, this will ensure that the prototype
    // property set via the decorator on Child is visible in Parent's
    // constructor.
    if (!this[PROTO_PROPERTY] || this[PROTO_PROPERTY] !== PROTO_PROPERTY) {
      // throw new Error('[GrandParent] Cannot view protoype property set on Parent.');
    }

    // This test ensures that we correctly extend prototype chains to include
    // classes "below" the decorator target.
    if (!this[CHILD_PROTO_PROPERTY] || this[CHILD_PROTO_PROPERTY] !== CHILD_PROTO_PROPERTY) {
      // throw new Error('[GrandParent] Cannot view prototype property set on Child.');
    }

    this[INHERITED_PROPERTY] = INHERITED_PROPERTY;
  }
}

GrandParent.prototype.foo = 'GrandParent-foo';


// ----- Parent ----------------------------------------------------------------

class Parent extends GrandParent {
  static [STATIC_PROPERTY] = STATIC_PROPERTY;

  constructor() {
    super();
    this[OWN_PROPERTY] = OWN_PROPERTY;
  }
}

Parent.prototype.foo = 'parent-foo';


// ----- Child -----------------------------------------------------------------

@StaticPropertyDecorator
@ProtoDecorator
@ConstructorDecorator
class Child extends Parent { }

Child.prototype[CHILD_PROTO_PROPERTY] = CHILD_PROTO_PROPERTY;


// ----- GrandChild ------------------------------------------------------------

class GrandChild extends Child { }


// ----- Test Suite ------------------------------------------------------------

describe('ClassDecorator', () => {
  let instance: any;

  beforeEach(() => {
    instance = new GrandChild();
  });

  it('should have a static member', () => {
    expect(Child[STATIC_PROPERTY]).toBe(STATIC_PROPERTY);
    expect(Child[STATIC_PROPERTY_VIA_DECORATOR]).toBe(STATIC_PROPERTY_VIA_DECORATOR);
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
    expect(instance instanceof Child).toBe(true);
    expect(instance instanceof Parent).toBe(true);
  });

  it('should pass name checks', () => {
    expect(instance.constructor.name).toBe(GrandChild.name);
  });

  it('should throw an error when not used on a class', () => {
    // @ts-ignore
    expect(() => ConstructorDecorator(undefined)).toThrow('Expected `decorated class` to be of type `Function` but received type `undefined`');
  });

  describe('when instantiating the decorated class directly', () => {
    @ConstructorDecorator
    class Direct { } // tslint:disable-line no-unnecessary-class

    it('should not make changes to the prototype chain', () => {
      // @ts-ignore
      const reflectSpy = jest.spyOn(global.Reflect, 'setPrototypeOf');
      new Direct(); // tslint:disable-line no-unused-expression
      expect(reflectSpy).not.toHaveBeenCalled();
    });
  });
});
