import { expect } from 'chai';

import * as toi from './object';

describe('toi.object', () => {
  const obj = toi.object;

  describe('value', () => {
    it('should recognize an object', () => {
      expect(obj({})).to.eql({});
    });

    it('should not recognize an array', () => {
      expect(() => obj([])).to.throw();
    });

    it('should not recognize a string', () => {
      expect(() => obj('')).to.throw();
    });

    it('should not recognize a function', () => {
      expect(() => obj(() => 3)).to.throw();
    });

    it('should recognize null', () => {
      expect(obj(null)).to.eq(null);
    });

    it('should recognize undefined', () => {
      expect(obj(undefined)).to.eq(undefined);
    });
  });

  describe('.required', () => {
    it('should recognize an object', () => {
      expect(obj.required({})).to.eql({});
    });

    it('should not recognize null', () => {
      expect(() => obj.required(null)).to.throw();
    });

    it('should not recognize undefined', () => {
      expect(() => obj.required(undefined)).to.throw();
    });
  });
});

describe('toi.object.structure', () => {
  const struct = toi.object.structure;
  const num = (value: any): number => {
    if ('number' !== typeof(value)) {
      throw new Error('Not a number');
    }

    return value;
  };

  describe('({ a: number, b: number, c: number }, \'c\')', () => {
    const obj = struct({ a: num, b: num, c: num }, 'c');

    it('should recognize { a: 1, b: 1 }', () => {
      expect(obj({ a: 1, b: 1 })).to.eql({ a: 1, b: 1 });
    });

    it('should recognize { a: 1, b: 1, c: 1 }', () => {
      expect(obj({ a: 1, b: 1, c: 1 })).to.eql({ a: 1, b: 1, c: 1 });
    });

    it('should not recognize {}', () => {
      expect(() => obj({})).to.throw();
    }); 

    it('should not recognize { a: 1 }', () => {
      expect(() => obj({ a: 1 })).to.throw();
    });

    it('should not recognize { a: 1, b: 1, c: 1, d: 1 }', () => {
      expect(() => obj({ a: 1, b: 1, c: 1, d: 1 })).to.throw();
    });

  });
});
