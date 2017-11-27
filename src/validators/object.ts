import * as toi from './../toi';

function objectator(value: any): object {
  const valueType = typeof(value);

  if ('object' !== valueType) {
    throw new toi.ValidationError(`Expected object got ${valueType}`);
  }

  if (Array.isArray(value)) {
    throw new toi.ValidationError(`Expected object got Array`);
  }

  return value as object;
}

function structurize(validator: toi.Validator<object>) {
  return <T, K extends keyof T>(structure: {[P in keyof T]: (value: any) => T[P]}, ...optional: K[]) => {
    const optionalStructure: any = {};

    optional.forEach(key => {
      optionalStructure[key] = true;
    });

    const mandatoryStructure: any = {};

    Object.keys(structure).forEach(key => {
      if(!optionalStructure[key]) {
        mandatoryStructure[key] = true;
      }
    });
    
    const structureAny: any = structure;
    const keys = Object.keys(mandatoryStructure);

    return validator.map(it => {
      if (it) {
        const itAny: any = it;
        const errors: toi.ValidationError[] = [];
        const strictKeys: any = {};

        keys.forEach(key => {
          try {
            strictKeys[key] = true;
            itAny[key] = structureAny[key](itAny[key]);
          } catch (e) {
            errors.push(e);
          }
        });

        optional.forEach(key => {
          strictKeys[key] = true;
        });

        Object.keys(it).forEach(key => {
          if (!strictKeys[key]) {
            errors.push(new toi.ValidationError(`Unexpected key ${key}`));
          }
        });

        if (errors.length > 0) {
          throw new toi.ValidationError('Multiple structure errors');
        }
      }

      return it as {[P in keyof T]: T[P]};
    });
  };
}

function wrap<T extends object>(validator: toi.Validator<T>) {
  return Object.assign(
    validator,
    { structure: structurize(validator) },
  );
}

const optional = toi.validator(toi.optional(objectator));
const required = toi.validator(toi.required(objectator));

export const object = Object.assign(
  wrap(optional),
  { required: wrap(required) },
);
