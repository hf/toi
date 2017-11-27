import * as toi from './../toi';

function stringator(value: any): string {
  const valueType = typeof(value);

  if ('string' !== valueType) {
    throw new toi.ValidationError(`Expected string got ${valueType}`);
  }

  return value as string;
}

function nonempty(validator: toi.Validator<string>) {
  return validator.map(it => {
    if ('' === it) { throw new toi.ValidationError(`Expected non-empty string`); }
    return it;
  });
}

function trim(validator: toi.Validator<string>) {
  return validator.map(it => {
    if (it) { return it.trim(); }
    return it;
  });
}

function regexp(validator: toi.Validator<string>) {
  return (regexp: RegExp) => {
    const vregexp = validator.map(it => {
      if (it || '' === it) { 
        if (!it.match(regexp)) {
          throw new toi.ValidationError(`Expected string to match ${regexp}`);
        }
      }

      return it;
    });

    return Object.assign(vregexp,
      { invalid: toi.invalid(vregexp) },
    );
  };
}

function length(validator: toi.Validator<string>) {
  return (length: number | { max?: number; min?: number }) => validator.map(it => {
    if (it || '' === it) {
      const lengthAny: any = length;

      if (('number' === typeof(lengthAny.max)) && it.length > lengthAny.max) {
        throw new toi.ValidationError(`Expected string to be at most ${lengthAny.max} chars long, got ${it.length}`);
      } else if (('number' === typeof(lengthAny.min)) && it.length < lengthAny.min) {
        throw new toi.ValidationError(`Expected string to be at least ${lengthAny.min} chars long, got ${it.length}`);
      } else if (('number' === typeof(lengthAny)) && lengthAny !== it.length) {
        throw new toi.ValidationError(`Expected string to be exactly ${lengthAny} chars long, got ${it.length}`);
      }
    }

    return it;
  });
}


function wrap(validator: toi.Validator<string>) {
  const trimmed = trim(validator);
  const trimmed_nonempty = nonempty(trimmed);
  const trimmed_regexp = regexp(trimmed);
  const trimmed_length = length(trimmed);
  const trimmed_valid = toi.valid(trimmed);
  const trimmed_invalid = toi.invalid(trimmed);

  const vnonempty = nonempty(validator);
  const vnonempty_invalid = toi.invalid(vnonempty);

  const vregexp = regexp(validator);
  const vlength = length(validator);
  const vvalid = toi.valid(validator);
  const vinvalid = toi.invalid(validator);

  return Object.assign(
    validator,
    { 
      trim: Object.assign(trimmed, 
        { 
          nonempty: trimmed_nonempty, 
          regexp: trimmed_regexp, 
          len: trimmed_length,
          valid: trimmed_valid,
          invalid: trimmed_invalid,
        }
      ),
      nonempty: Object.assign(vnonempty, 
        { 
          invalid: vnonempty_invalid,
        }
      ),
      regexp: vregexp,
      len: vlength,
      valid: vvalid,
      invalid: vinvalid,
    },
  );
}

const optional = toi.validator(toi.optional(stringator));
const required = toi.validator(toi.required(stringator));

export const string = Object.assign(
  wrap(optional),
  { required: wrap(required) },
);
