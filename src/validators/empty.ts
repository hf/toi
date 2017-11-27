import * as toi from './../toi';

function nullator(value: any): null {
  if (null !== value) {
    throw new toi.ValidationError(`Expected null got ${typeof(value)}`);
  }

  return null;
}

function undefinedator(value: any): undefined {
  const valueType = typeof(value);

  if ('undefined' !== valueType) {
    throw new toi.ValidationError(`Expected undefined got ${valueType}`);
  }

  return undefined;
}

export const empty = {
  undefined: toi.validator(undefinedator),
  null: toi.validator(nullator),
};
