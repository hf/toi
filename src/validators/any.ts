import * as toi from '../toi';

function anyator(value: any): any {
  return value;
}

function wrap(validator: toi.Validator<any>) {
  return Object.assign(
    validator,
    { 
      truthy: validator.map(it => !!it),
      falsy:  validator.map(it => !!!it),
      cast: <C>() => validator.map(it => it as C),
    },
  );
}

const optional = toi.validator(toi.optional(anyator));
const required = toi.validator(toi.required(anyator));

export const any = Object.assign(
  wrap(optional),
  { required: wrap(required) }
);

