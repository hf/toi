import { expect } from 'chai';

import * as toi from './number';

describe('toi.number', () => {
  const num = toi.number;

  describe('value', () => {
    it('should recognize a number', () => {
      expect(num(3)).to.eq(3);
    });

    it('should not recognize a string', () => {
      expect(() => num('3')).to.throw();
    });

    it('should allow undefined', () => {
      expect(num(undefined)).to.eq(undefined);
    });

    it('should allow null', () => {
      expect(num(null)).to.eq(null);
    });
  });

  describe('.required', () => {
    const req = num.required;

    it('should recognize a number', () => {
      expect(req(3)).to.eq(3);
    });

    it('should not recognize a string', () => {
      expect(() => req('3')).to.throw();
    });

    it('should not allow undefined', () => {
      expect(() => req(undefined)).to.throw();
    });

    it('should not allow null', () => {
      expect(() => req(null)).to.throw();
    });
  });
});

describe('toi.number.range({ min: 0 })', () => {
  const num = toi.number.range({ min: 0 });

  describe('value', () => {
    it('should recognize a positive number', () => {
      expect(num(3)).to.eq(3);
    });

    it('should recognize recognize 0', () => {
      expect(num(0)).to.eq(0);
    });

    it('should not recognize negative number', () => {
      expect(() => num(-1)).to.throw();
    });
  });
});

describe('toi.number.range({ max: 0 })', () => {
  const num = toi.number.range({ max: 0 });

  describe('value', () => {
    it('should recognize a negative number', () => {
      expect(num(-3)).to.eq(-3);
    });

    it('should recognize recognize 0', () => {
      expect(num(0)).to.eq(0);
    });

    it('should not recognize positive number', () => {
      expect(() => num(1)).to.throw();
    });
  });
});

describe('toi.number.range({ min: 0, max: 10 })', () => {
  const num = toi.number.range({ min: 0, max: 10 });

  describe('value', () => {
    it('should recognize a number in range', () => {
      expect(num(5)).to.eq(5);
    });

    it('should recognize recognize 0', () => {
      expect(num(0)).to.eq(0);
    });

    it('should recognize recognize 10', () => {
      expect(num(10)).to.eq(10);
    });

    it('should not recognize number below range', () => {
      expect(() => num(-1)).to.throw();
    });

    it('should not recognize number above range', () => {
      expect(() => num(11)).to.throw();
    });
  });

  describe('.invalid(5)', () => {
    it('should not recognize 5', () => {
      expect(num(5)).to.eq(5);
      expect(() => num.invalid(5)(5)).to.throw();
    });

    it('should recognize 3', () => {
      expect(num.invalid(5)(3)).to.eq(3);
    });
  });
});

describe('toi.integer', () => {
  const integer = toi.integer;

  describe('value', () => {
    it('should recognize 0', () => {
      expect(integer(0)).to.eq(0);
    });

    it('should recognize -1', () => {
      expect(integer(-1)).to.eq(-1);
    });

    it('should recognize 1', () => {
      expect(integer(1)).to.eq(1);
    });

    it('should not recognize 0.1', () => {
      expect(() => integer(0.1)).to.throw();
    });

    it('should not recognize -0.1', () => {
      expect(() => integer(-0.1)).to.throw();
    });
  });
});
