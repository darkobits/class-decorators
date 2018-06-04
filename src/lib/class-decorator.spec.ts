import ClassDecorator from './class-decorator';


const STATIC_PROPERTY = Symbol('STATIC_PROPERTY');
const INHERITED_PROPERTY = Symbol('INHERITED_PROPERTY');
const OWN_PROPERTY = Symbol('OWN_PROPERTY');
const PROTO_PROPERTY = Symbol('PROTO_PROPERTY');
const DECORATOR_OWN_PROPERTY = Symbol('DECORATOR_OWN_PROPERTY');


// ----- Test Decorators -------------------------------------------------------

const StaticPropertyDecorator = ClassDecorator(Class => {
  Class[STATIC_PROPERTY] = STATIC_PROPERTY;
});

const ProtoDecorator = ClassDecorator(Class => {
  Class.prototype[PROTO_PROPERTY] = PROTO_PROPERTY;
});

const ConstructorDecorator = ClassDecorator(() => function ({constructor, args}) {
  this[DECORATOR_OWN_PROPERTY] = DECORATOR_OWN_PROPERTY;
  constructor(...args);
});


// ----- Test Classes ----------------------------------------------------------

class SuperSubject { // tslint:disable-line no-unnecessary-class
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
  let instance;

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
    expect(() => ConstructorDecorator(null)).toThrow('Expected `decorated class` to be of type `Function` but received type `null`');
  });
});
