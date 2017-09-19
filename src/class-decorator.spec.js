import createClassDecorator from './class-decorator';

function decorator(props) { // eslint-disable-line no-unused-vars
  return createClassDecorator(function (ctor, ...args) { // eslint-disable-line no-unused-vars
    Object.assign(this, props);
    return ctor(...args);
  });
}

describe('Class Decorator', () => {
  describe('Usage with non-classes', () => {
    it('should throw an error when used on class methods', () => {
      expect(() => {
        class Person { // eslint-disable-line no-unused-vars
          @decorator()
          classMethod() {

          }
        }
      }).toThrow('Must be used on a class or constructor function');
    });

    it('should throw an error when used on object literal methods', () => {
      expect(() => {
        const myObj = { // eslint-disable-line no-unused-vars
          @decorator()
          objMethod() {

          }
        };
      }).toThrow('Must be used on a class or constructor function');
    });
  });

  describe('preserving class names', () => {
    it('should preserve the original class name', () => {
      @decorator()
      class Person { }

      const myPerson = new Person();
      expect(myPerson.constructor.name).toEqual(Person.name);
    });
  });

  describe('instanceof', () => {
    it('should pass instanceof checks', () => {
      function decorator(props) { // eslint-disable-line no-unused-vars
        return createClassDecorator(function (ctor, ...args) { // eslint-disable-line no-unused-vars
          Object.assign(this, props);
          return ctor(...args);
        });
      }

      @decorator()
      class Foo { }

      const myPerson = new Foo();
      expect(myPerson instanceof Foo).toBe(true);
    });
  });

  describe('decorating instances', () => {
    it('should be able to modify the newly-created instance', () => {
      const property = 'foo';

      @decorator({
        [property]: 'bar'
      })
      class Foo { }

      const myFoo = new Foo();

      expect(myFoo[property]).toBeTruthy();
    });
  });

  describe('binding the original constructor', () => {
    it('should bind the original constructor to the new instance', () => {
      @decorator()
      class Foo {
        constructor() {
          this.foo = true;
        }
      }

      const myFoo = new Foo();

      expect(myFoo.foo).toBe(true);
    });
  });
});
