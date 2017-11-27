import { expect } from 'chai';

import * as toi from './empty';

describe('toi.empty.null', () => {
  const vnull = toi.empty.null;

  describe('value', () => {
    it('should accept only null', () => {
      expect(vnull(null)).to.eq(null);
      expect(() => vnull(0)).to.throw();
      expect(() => vnull('')).to.throw();
      expect(() => vnull(undefined)).to.throw();
      expect(() => vnull([])).to.throw();
      expect(() => vnull(false)).to.throw();
      expect(() => vnull({})).to.throw();
    });
  });
});

describe('toi.empty.undefined', () => {
  const vundef = toi.empty.undefined;

  describe('value', () => {
    it('should accept only null', () => {
      expect(vundef(undefined)).to.eq(undefined);
      expect(() => vundef(0)).to.throw();
      expect(() => vundef('')).to.throw();
      expect(() => vundef(null)).to.throw();
      expect(() => vundef([])).to.throw();
      expect(() => vundef(false)).to.throw();
      expect(() => vundef({})).to.throw();
    });
  });
});
