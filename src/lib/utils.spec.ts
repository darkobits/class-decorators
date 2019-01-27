import {doTest, relativeRate} from './utils';


describe('doTest', () => {
  it('should run the provided function the indicated number of times', () => {
    const task = jest.fn();
    const n = 100;

    doTest({
      iterations: n,
      label: 'foo'
    }, task);

    doTest({
      iterations: n,
      label: 'foo',
      baseTime: 100
    }, task);

    expect(task).toHaveBeenCalledTimes(n * 2);
  });
});


describe('relativeRate', () => {
  describe('when a > b', () => {
    it('should indicate an increase', () => {
      expect(relativeRate(1, 2)).toBe('2.00x faster');
    });
  });

  describe('when a < b', () => {
    it('should indicate an decrease', () => {
      expect(relativeRate(2, 1)).toBe('2.00x slower');
    });
  });

  describe('when a === b', () => {
    it('should indicate no change', () => {
      expect(relativeRate(1, 1)).toBe('equal');
    });
  });
});
