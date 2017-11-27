import { expect } from 'chai';

import * as toi from './array';

describe('toi.array', () => {
  const arr = toi.array;

  describe('value', () => {
    it('should recognize an array', () => expect(arr([])).to.eql([]));
    it('should recognize undefined', () => expect(arr(undefined)).to.eq(undefined));
    it('should recognize null', () => expect(arr(null)).to.eq(null));
    it('should not recognize a string', () => expect(() => arr('')).to.throw());
    it('should not recognize an object', () => expect(() => arr({})).to.throw());
  });

  describe('.required', () => {
    const req = toi.array.required;

    it('should not recognize undefined', () => expect(() => req(undefined)).to.throw());
    it('should not recognize null', () => expect(() => req(null)).to.throw());
  });
});

describe('toi.array.nonempty', () => {
  const nonempty = toi.array.nonempty;

  describe('value', () => {
    it('should not accept []', () => expect(() => nonempty([])).to.throw());
    it('should accept [1]', () => expect(nonempty([1])).to.eql([1]));
  });
});

describe('toi.array.structure(number)', () => {
  const num = (value: any): number => {
    if ('number' !== typeof(value)) {
      throw new Error('Expected number');
    }

    return value;
  };

  const arr = toi.array.structure(num);

  describe('value', () => {
    it('should accept an empty array', () => expect(arr([])).to.eql([]));
    it('should not accept an array of strings', () => expect(() => arr(['hello'])).to.throw());
  });
});

describe('toi.array.len(5)', () => {
  const arr = toi.array.len(5);

  describe('value', () => {
    it('should accept array of 5 elements', () => expect(arr([1, 2, 3, 4, 5])).to.eql([1, 2, 3, 4, 5]));
    it('should not accept an array of 4 elements', () => expect(() => arr([1, 2, 3, 4])).to.throw());
    it('should not accept an array of 6 elements', () => expect(() => arr([1, 2, 3, 4, 5, 6])).to.throw());
  });
});

describe('toi.array.len({ max: 5 })', () => {
  const arr = toi.array.len({ max: 5 });

  describe('value', () => {
    it('should accept array of 5 elements', () => expect(arr([1, 2, 3, 4, 5])).to.eql([1, 2, 3, 4, 5]));
    it('should accept an empty array', () => expect(arr([])).to.eql([]));
    it('should accept an array of 4 elements', () => expect(arr([1, 2, 3, 4])).to.eql([1, 2, 3, 4]));

    it('should not accept an array of 6 elements', () => expect(() => arr([1, 2, 3, 4, 5, 6])).to.throw());
  });
});

describe('toi.array.len({ min: 5 })', () => {
  const arr = toi.array.len({ min: 5 });

  describe('value', () => {
    it('should accept array of 5 elements', () => expect(arr([1, 2, 3, 4, 5])).to.eql([1, 2, 3, 4, 5]));
    it('should accept an array of 6 elements', () => expect(arr([1, 2, 3, 4, 5, 6])).to.eql([1, 2, 3, 4, 5, 6]));

    it('should not accept an array of 4 elements', () => expect(() => arr([1, 2, 3, 4])).to.throw());
  });
});

describe('toi.array.len({ min: 1, max: 3 })', () => {
  const arr = toi.array.len({ min: 1, max: 3 });

  describe('value', () => {
    it('should accept array of 1 element', () => expect(arr([1])).to.eql([1]));
    it('should accept array of 3 elements', () => expect(arr([1, 2, 3])).to.eql([1, 2, 3]));

    it('should not accept an empty array', () => expect(() => arr([])).to.throw());
    it('should not accept an array of 4 elements', () => expect(() => arr([1, 2, 3, 4])).to.throw());
  });
});
