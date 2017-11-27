import { expect } from 'chai';

import * as toi from './string';

describe('toi.string', () => {
  const str = toi.string;

  describe('value', () => {
    it('should recognize a string', () => {
      expect(str('hello')).to.eq('hello');
    });

    it('should recognize an empty string', () => {
      expect(str('')).to.eq('');
    });

    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should not recognize a number', () => {
      expect(() => str(3)).to.throw();
    });

    it('should not recognize an array', () => {
      expect(() => str(['a', 'b', 'c'])).to.throw();
    });
  });

  describe('.required', () => {
    it('should not recognize undefined', () => {
      expect(() => str.required(undefined)).to.throw();
    });

    it('should not recognize null', () => {
      expect(() => str.required(null)).to.throw();
    });
  });
});

describe('toi.string.nonempty', () => {
  const str = toi.string.nonempty;

  describe('value', () => {
    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should recognize non-empty string', () => {
      expect(str('hello')).to.eq('hello');
    });

    it('should not recognize an empty string', () => {
      expect(() => str('')).to.throw();
    });
  });
});

describe('toi.string.trim', () => {
  const str = toi.string.trim;

  describe('value', () => {
    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should trim string', () => {
      expect(str(' hello ')).to.eq('hello');
    });
  });

  describe('.nonempty', () => {
    it('should not allow trimmed empty string', () => {
      expect(() => str.nonempty(' ')).to.throw();
    });
  });

  describe('.valid', () => {
    it('should recognize trimmed valid strings', () => {
      expect(str.valid('hello')(' hello ')).to.eq('hello');
    });

    it('should not recognize trimmed invalid strings', () => {
      expect(() => str.valid('hello')(' hi ')).to.throw();
    });
  });

  describe('.invalid', () => {
    it('should recognize trimmed invalid strings', () => {
      expect(() => str.invalid('hello')(' hello ')).to.throw();
    });

    it('should recognize trimmed valid strings', () => {
      expect(str.invalid('hello')(' hi ')).to.eq('hi');
    });
  });

  describe('.regexp', () => {
    it('should match trimmed string', () => {
      expect(str.regexp(/^Hello$/)(' Hello ')).to.eq('Hello');
    });

    it('should not match trimmed string', () => {
      expect(() => str.regexp(/^Hello$/)(' Hi ')).to.throw();
    });
  });

  describe('.len(2)', () => {
    it('should recognize trimmed length', () => {
      expect(str.len(2)(' hi ')).to.eq('hi');
    });

    it('should not recognize trimmed length', () => {
      expect(() => str.len(2)(' ')).to.throw();
    });
  });
});

describe('toi.string.regexp', () => {
  const str = toi.string.regexp(/Hello/i);

  describe('value', () => {
    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should match regexp', () => {
      expect(str('Hello')).to.eq('Hello');
    });

    it('should not match regexp', () => {
      expect(() => str('nomatch')).to.throw();
    });
  });

  describe('.invalid', () => {
    it('should not allow invalid values', () => {
      expect(str('hello world')).to.eq('hello world');
      expect(() => str.invalid('hello world')('hello world')).to.throw();
    });

    it('should allow matched valid values', () => {
      expect(str.invalid('hello there')('hello world')).to.eq('hello world');
    });
  });
});

describe('toi.string.len(5)', () => {
  const str = toi.string.len(5);

  describe('value', () => {
    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should match a string of length 5', () => {
      expect(str('hello')).to.eq('hello');
    });

    it('should not match a short string', () => {
      expect(() => str('hell')).to.throw();
    });

    it('should not match a long string', () => {
      expect(() => str('hello!')).to.throw();
    });
  });
});

describe('toi.string.len({ min: 2 })', () => {
  const str = toi.string.len({ min: 2 });

  describe('value', () => {
    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should match a string of length 2', () => {
      expect(str('hi')).to.eq('hi');
    });

    it('should match a longer string', () => {
      expect(str('hello')).to.eq('hello');
    });

    it('should not match a shorter string', () => {
      expect(() => str('h')).to.throw();
    });
  });
});

describe('toi.string.len({ max: 2 })', () => {
  const str = toi.string.len({ max: 2 });

  describe('value', () => {
    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should match a string of length 2', () => {
      expect(str('hi')).to.eq('hi');
    });

    it('should not match a longer string', () => {
      expect(() => str('hello')).to.throw();
    });

    it('should match a shorter string', () => {
      expect(str('')).to.eq('');
    });
  });
});

describe('toi.string.len({ min: 0, max: 5 })', () => {
  const str = toi.string.len({ min: 0, max: 5 });

  describe('value', () => {
    it('should recognize undefined', () => {
      expect(str(undefined)).to.eq(undefined);
    });

    it('should recognize null', () => {
      expect(str(null)).to.eq(null);
    });

    it('should match empty string', () => {
      expect(str('')).to.eq('');
    });

    it('should not match a longer string', () => {
      expect(() => str('hello!')).to.throw();
    });

    it('should match the longest string', () => {
      expect(str('hello')).to.eq('hello');
    });

    it('should match a string', () => {
      expect(str('hi')).to.eq('hi');
    });
  });
});
