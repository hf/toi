export class ValidationError extends Error {
  public isToi = true

  constructor(msg: string) {
    super(msg);
  }
}

export interface Validator<T> {
  (value: any): T;

  map: <O>(f: (value: T) => O) => Validator<O>;
  or:  <O>(f: (value: any) => O) => Validator<T | O>;
  and: <O>(f: (value: T) => O) => Validator<T & O>;
}

export function validator<T>(validationf: (value: any) => T): Validator<T> {
  return Object.assign(
    validationf,
    {
      map: <O>(f: (value: T) => O) => validator(value => f(validationf(value))),
      or:  <O>(f: (value: any) => O) => validator(value => {
        const errors = [];

        let ord: T | O;

        try {
          ord = validationf(value);
        } catch (e) {
          errors.push(e);
        }

        if (errors.length > 0) {
          try {
            ord = f(value);
          } catch (e) {
            errors.push(e);
          }
        }

        if (errors.length > 1) {
          throw new ValidationError(`Neither type applies`);
        }

        return ord;
      }),
      and: <O>(f: (value: T) => O) => validator(value => {
        const errors = [];

        const orig: T = validationf(value);
        const and: T & O = f(orig) as T & O;

        if (orig !== and) {
          throw new ValidationError(`Intersection can be defined only if both functions return the same reference`);
        }

        return and;
      }),
    }
  );
}

export function optional<T>(ator: (value: any) => T) {
  return (value: any): T => {
    if (null === value) { return value; }
    if ('undefined' === typeof(value)) { return undefined; }

    return ator(value);
  };
}

export function required<T>(ator: (value: any) => T): (value: any) => T {
  return (value: any): T => {
    if (null === value) { throw new ValidationError(`Expected value got null`); }
    if ('undefined' === typeof(value)) { throw new ValidationError(`Expected value got undefined`); }

    return ator(value);
  };
}

export function valid<T>(validator: Validator<T>) {
  return (...items: T[]) => validator.map(it => {
    let found = false;

    items.forEach(item => {
      found = it === item;
    });

    if (!found) {
      throw new ValidationError(`Expected one of ${items}, got ${it}`);
    }

    return it;
  });
}

export function invalid<T>(validator: Validator<T>) {
  return (...items: T[]) => validator.map(it => {
    if (it) {
      items.forEach(item => {
        if(it === item) {
          throw new ValidationError(`Expected none of ${items}, got ${it}`);
        }
      });
    }

    return it;
  });
}

export function validate<T>(value: any, validator: (value: any) => T): T {
  return validator(value);
}

export function check<T>(value: any, validator: (value: any) => T): value is T {
  try {
    validator(value);
    return true;
  } catch (e) {
    return false;
  }
}
