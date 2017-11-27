import * as toi from './../toi';

function booleanator(value: any): boolean {
  const valueType = typeof(value);

  if ('boolean' !== valueType) {
    throw new toi.ValidationError(`Expected boolean got ${valueType}`);
  }

  return value as boolean;
}

function wrap(validator: toi.Validator<boolean>) {
  return Object.assign(
    validator,
    { 
      true: validator.map(it => {
        if (it) { 
          if (true !== it) { throw new toi.ValidationError(`Expected true but got ${it}`); }
        }

        return it;
      }),
      false: validator.map(it => {
        if (it || false === it) {
          if (false !== it) { throw new toi.ValidationError(`Expected false but got ${it}`); }
        }

        return it;
      }),
    });
}

const optional = toi.validator(toi.optional(booleanator));
const required = toi.validator(toi.required(booleanator));

const wrapped_required = wrap(toi.validator(toi.required(booleanator)));

export const boolean = Object.assign(
  wrap(optional),
  { 
    required: Object.assign(required, {
      true: wrapped_required.true.map((_): true => true),
      false: wrapped_required.false.map((_): false => false),
    }),
  }
);
