import MethodDecorator from './method-decorator';


const ORIG_RETURN = Symbol('ORIG_RETURN');
const DECORATOR_RETURN = Symbol('DECORATOR_RETURN');


// ----- Test Decorator --------------------------------------------------------

const TestDecorator = MethodDecorator(({method, methodName, args}) => {
  if (args[0] === DECORATOR_RETURN) {
    return DECORATOR_RETURN;
  }

  return method(...args);
});


// ----- Test Class ------------------------------------------------------------

class Subject {
  testMethodWasCalled: boolean = false;

  @TestDecorator
  testMethod(...args) {
    this.testMethodWasCalled = true;
    return ORIG_RETURN;
  }
}


describe('MethodDecorator', () => {
  let instance;

  beforeEach(() => {
    instance = new Subject();
  });

  it('should return the original value', () => {
    expect(instance.testMethod()).toBe(ORIG_RETURN);
    expect(instance.testMethodWasCalled).toBe(true);
  });

  it('should return a different value', () => {
    expect(instance.testMethod(DECORATOR_RETURN)).toBe(DECORATOR_RETURN);
    expect(instance.testMethodWasCalled).toBe(false);
  });
});
