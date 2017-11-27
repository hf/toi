import * as toi from '../toi';

function numberator(value: any): number {
  const valueType = typeof(value);

  if ('number' !== valueType) {
    throw new toi.ValidationError(`Expected number got ${valueType}`);
  }

  return value as number;
}

function integerator(value: any): number {
  const valueType = typeof(value);

  if ('number' !== valueType) {
    throw new toi.ValidationError(`Expected number got ${valueType}`);
  }
  
  const num = value as number;
  const trunc = Math.trunc(num);

  if (trunc !== num) { 
    throw new toi.ValidationError(`Expected integer, got real`);
  }

  return num;
}

function range(validator: toi.Validator<number>) {
  return (range: { min?: number, max?: number }) => {
    const ranged = validator.map(it => {
      const rangeAny: any = range;

      if (it || 0 === it) {
        if ((rangeAny.max || 0 === rangeAny.max) && it > rangeAny.max) { 
          throw new toi.ValidationError(`Expected number to be at most ${rangeAny.max}, got ${it}`) 
        } else if ((rangeAny.min || 0 === rangeAny.min) && it < rangeAny.min) { 
          throw new toi.ValidationError(`Expected number to be at least ${rangeAny.min}, got ${it}`)
        } 
      }

      return it;
    });

    return Object.assign(ranged, { invalid: toi.invalid(ranged) });
  };
}

function wrap(validator: toi.Validator<number>) {
  const vrange = range(validator);
  const vvalid = toi.valid(validator);
  const vinvalid = toi.invalid(validator);

  return Object.assign(
    validator,
    { 
      range: vrange,
      valid: vvalid,
      invalid: vinvalid,
    }
  );
}

const num_optional = toi.validator(toi.optional(numberator));
const num_required = toi.validator(toi.required(numberator));

export const number = Object.assign(
  wrap(num_optional),
  { required: wrap(num_required) },
);

const int_optional = toi.validator(toi.optional(integerator));
const int_required = toi.validator(toi.required(integerator));

export const integer = Object.assign(
  wrap(int_optional),
  { required: wrap(int_required) },
);
