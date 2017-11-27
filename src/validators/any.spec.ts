import { expect } from 'chai';

import * as toi from './any';

describe('toi.any', () => {
  const vany = toi.any;

  describe('value', () => {
    it('should accept anything', () => {
      expect(vany(0)).to.eq(0);
      expect(vany('')).to.eq('');
      expect(vany([])).to.eql([]);
      expect(vany({})).to.eql({});
      expect(vany(null)).to.eq(null);
      expect(vany(undefined)).to.eq(undefined);
      expect(vany(true)).to.eq(true);
      expect(vany(false)).to.eq(false);
    });
  });

  describe('.required', () => {
    it('should not accept null', () => expect(() => vany.required(null)).to.throw());
    it('should not accept undefined', () => expect(() => vany.required(undefined)).to.throw());
  });

  describe('.truthy', () => {
    const truthy = vany.truthy;

    it('should accept null as false', () => expect(truthy(null)).to.eq(false));
    it('should accept undefined as false', () => expect(truthy(undefined)).to.eq(false));
    it('should accept 0 as false', () => expect(truthy(0)).to.eq(false));
    it('should accept empty string as false', () => expect(truthy('')).to.eq(false));
  });

  describe('.falsy', () => {
    const falsy= vany.falsy;

    it('should accept null as true', () => expect(falsy(null)).to.eq(true));
    it('should accept undefined as true', () => expect(falsy(undefined)).to.eq(true));
    it('should accept 0 as true', () => expect(falsy(0)).to.eq(true));
    it('should accept empty string as true', () => expect(falsy('')).to.eq(true));
  });
});
