import { expect } from 'chai';

import * as toi from './boolean';

describe('toi.boolean', () => {
  const bool = toi.boolean;

  describe('value', () => {
    it('should accept true', () => expect(bool(true)).to.eq(true));
    it('should accept false', () => expect(bool(false)).to.eq(false));

    it('should accept undefined', () => expect(bool(undefined)).to.eq(undefined));
    it('should accept null', () => expect(bool(null)).to.eq(null));

    it('should not accept 0', () => expect(() => bool(0)).to.throw());
    it('should not accept empty string', () => expect(() => bool('')).to.throw());
  });

  describe('.required', () => {
    const req = bool.required;

    it('should accept true', () => expect(req(true)).to.eq(true));
    it('should accept false', () => expect(req(false)).to.eq(false));

    it('should not accept undefined', () => expect(() => req(undefined)).to.throw());
    it('should not accept null', () => expect(() => req(null)).to.throw());
  });
});
