import classDecorator from './class-decorator';

const decorator = classDecorator(DecoratedClass => ({ // eslint-disable-line no-unused-vars
  onConstruct() {
    this.decoratorProp = true;
  },
  prototype: {
    decoratorMethod() { }
  },
  static: {
    staticDecoratorProp: true,
    staticDecoratorMethod() { }
  }
}));

@decorator
class ParentClass {
  static staticParentProp = true; // eslint-disable-line no-undef
  static staticParentMethod() { }
  parentProp = true; // eslint-disable-line no-undef
  parentMethod() { }
}

@decorator
class ChildClass extends ParentClass {
  static staticChildProp = true; // eslint-disable-line no-undef
  static staticChildMethod() { }
  childProp = true; // eslint-disable-line no-undef
  childMethod() { }
}

describe('Class Decorator', () => {
  describe('decorating static properties', () => {
    const COMMON_PROPS = ['staticDecoratorMethod', 'staticDecoratorProp'];

    COMMON_PROPS.concat(['staticParentMethod', 'staticParentProp']).forEach(prop => {
      it(`should define ${prop} on ParentClass`, () => {
        expect(ParentClass[prop]).toBeTruthy();
      });
    });

    COMMON_PROPS.concat(['staticChildMethod', 'staticChildProp']).forEach(prop => {
      it(`should define ${prop} on ChildClass`, () => {
        expect(ChildClass[prop]).toBeTruthy();
      });
    });
  });

  describe('decorating prototypes', () => {
    const PARENT_METHODS = ['parentMethod', 'decoratorMethod'];

    PARENT_METHODS.forEach(prop => {
      it(`should have ${prop} on the ParentClass prototype`, () => {
        const parent = new ParentClass();
        expect(parent[prop]).toBeTruthy();
      });
    });

    PARENT_METHODS.concat(['childMethod']).forEach(prop => {
      it(`should have ${prop} on the ChildClass prototype`, () => {
        const child = new ChildClass();
        expect(child[prop]).toBeTruthy();
      });
    });
  });

  describe('decorating instances', () => {
    const PARENT_PROPS = ['parentProp', 'decoratorProp'];

    PARENT_PROPS.forEach(prop => {
      it(`should have ${prop} on the ParentClass prototype`, () => {
        const parent = new ParentClass();
        expect(parent[prop]).toBeTruthy();
      });
    });

    PARENT_PROPS.concat(['childProp']).forEach(prop => {
      it(`should have ${prop} on the ChildClass prototype`, () => {
        const child = new ChildClass();
        expect(child[prop]).toBeTruthy();
      });
    });
  });

  describe('usage with non-classes', () => {
    it('should throw an error when used on class methods', () => {
      expect(() => {
        class Foo { // eslint-disable-line no-unused-vars
          @decorator()
          classMethod() {

          }
        }
      }).toThrow('Expected constructor function');
    });

    it('should throw an error when used on object literal methods', () => {
      expect(() => {
        const myObj = { // eslint-disable-line no-unused-vars
          @decorator()
          objMethod() { }
        };
      }).toThrow('Expected constructor function');
    });
  });

  describe('providing an object', () => {
    const prop = 'foo';
    const value = 'bar';

    const decoratorObj = classDecorator({ // eslint-disable-line no-unused-vars
      onConstruct() {
        this[prop] = value;
      }
    });

    @decoratorObj
    class DecoratedClass { }

    it('should correctly decorate the class', () => {
      expect(new DecoratedClass()[prop]).toEqual(value);
    });
  });

  describe('returning a non-object', () => {
    it('should throw an error when a non-object is returned', () => {
      expect(() => {
        const badDecorator = classDecorator(() => { // eslint-disable-line no-unused-vars
          return false;
        });

        @badDecorator
        class Foo { } // eslint-disable-line no-unused-vars
      }).toThrow('Expected decorator to be of type "Object"');
    });
  });

  describe('instanceof', () => {
    it('should pass instanceof checks', () => {
      const parent = new ParentClass();
      const child = new ChildClass();

      expect(parent instanceof ParentClass).toBe(true);
      expect(child instanceof ParentClass).toBe(true);
      expect(child instanceof ChildClass).toBe(true);
    });
  });
});
