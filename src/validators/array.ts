import * as toi from './../toi';

export function arrayator(value: any): Array<any> {
  if (!Array.isArray(value)) {
    throw new toi.ValidationError(`Expected Array got ${typeof(value)}`);
  }

  return value as Array<any>;
}

function length<T>(validator: toi.Validator<T[]>) {
  return (length: number | { min?: number; max?: number }) => {
    const lengthed = validator.map(it => {
      const lengthAny: any = length;

      if (it) {
        if ('number' === typeof(lengthAny.max) && it.length > lengthAny.max) {
          throw new toi.ValidationError(`Expected array to be at most ${lengthAny.max} elements long, got ${it.length}`);
        } else if ('number' === typeof(lengthAny.min) && it.length < lengthAny.min) {
          throw new toi.ValidationError(`Expected array to be at least ${lengthAny.min} elements long, got ${it.length}`);
        } else if ('number' === typeof(lengthAny) && lengthAny !== it.length) {
          throw new toi.ValidationError(`Expected array to be exactly ${lengthAny} elements long, got ${it.length}`);
        }
      }

      return it;
    });

    return Object.assign(lengthed,
      { structure: structurize(lengthed) },
    );
  }
}

function structurize<T>(validator: toi.Validator<any[]>) {
  return <T>(structure: (value: any) => T) => validator.map(it => {
      return it.map(structure);
    });
}

function wrap<T>(validator: toi.Validator<any[]>) {
  return Object.assign(
    validator,
    { 
      len: length(validator), 
      structure: structurize(validator), 
      nonempty: length(validator)({ min: 1 }) 
    },
  );
}

const optional = toi.validator(toi.optional(arrayator));
const required = toi.validator(toi.required(arrayator));

export const array = Object.assign(
  wrap(optional),
  { required: wrap(required) },
);
