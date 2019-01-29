import {
  createFunctionWithName,
  normalizePrototype,
  getPenultimatePrototype,
  findLastPrototypeBefore,
  clonePrototype,
  setPrototypeOfWithRestore
} from './utils';


const A: any = {};
A.name = 'A';

const B = Object.create(A);
B.name = 'B';

const C = Object.create(B);
C.name = 'C';

const D = Object.create(C);
D.name = 'D';


describe('createFunctionWithName', () => {
  it('should return a function with the indicated name and implementation', () => {
    const fn = jest.fn();
    const name = 'foo';
    const namedFn = createFunctionWithName(name, fn);

    namedFn();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.name).toBe(name);
  });
});


describe('normalizePrototype', () => {
  class Parent { } // tslint:disable-line no-unnecessary-class
  class Child extends Parent { }

  describe('when provided a function/class', () => {
    it('should return the prototype of the class', () => {
      expect(normalizePrototype(Child)).toBe(Child.prototype);
    });
  });

  describe('when provided an object', () => {
    it('should return the object', () => {
      expect(normalizePrototype(Child.prototype)).toBe(Child.prototype);
    });
  });
});


describe('getPenultimatePrototype', () => {
  it('should return the last object in the subjects prototype chain before Object.prototype', () => {
    expect(getPenultimatePrototype(D)).toBe(A);
  });
});


describe('findLastPrototypeBefore', () => {
  describe('when stopAtExclusive does not exist in the subject chain', () => {
    it('should return undefined', () => {
      expect(findLastPrototypeBefore(D, Array.prototype)).toBe(undefined);
    });
  });

  describe('when stopAtExclusive exists in the subject chain', () => {
    it('should return the last prototype in the subject chain prior to stopAtExclusive', () => {
      expect(findLastPrototypeBefore(D, B)).toBe(C);
      expect(findLastPrototypeBefore(D, A)).toBe(B);
    });
  });
});


describe('clonePrototype', () => {
  describe('when provided a non-object', () => {
    it('should throw an error', () => {
      expect(() => {
        // @ts-ignore
        clonePrototype(undefined);
      }).toThrow('Reflect.getPrototypeOf called on non-object');
    });
  });
});


describe('setPrototypeWithRestore', () => {
  describe('when a cyclic chain would be created', () => {
    it('should throw an error', () => {
      expect(() => {
        setPrototypeOfWithRestore(Object.prototype, Array.prototype);
      }).toThrow('Failed to update prototype; cyclic chain would result.');
    });
  });

  describe('when a cyclic chain would be created upon restore', () => {
    it('should throw an error', () => {
      const A = {}; // tslint:disable-line no-shadowed-variable
      const B = Object.create(A); // tslint:disable-line no-shadowed-variable
      const C = Object.create(B); // tslint:disable-line no-shadowed-variable
      const D = Object.create(C); // tslint:disable-line no-shadowed-variable

      const restore = setPrototypeOfWithRestore(D, A);

      Reflect.setPrototypeOf(C, D);

      expect(() => {
        restore();
      }).toThrow('Failed to restore prototype; cyclic chain would result.');
    });
  });
});
