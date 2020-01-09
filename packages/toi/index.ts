/**
 * Toi is a TypeScript validator, inspired by Joi.
 */

/**
 * Mirrors the null or undefinedness of T into the type U
 */
type TransferNullability<T, U> = T extends null | undefined ? U | null | undefined : U;

/**
 * A validator is a function that throws a {@link ValidationError} when its input value
 * does not match it's output type.
 *
 * A validator must obey these rules:
 *
 *  1. Must allow null and undefined to pass, unless really special.
 *  2. Must always throw a {@link ValidationError} if the value is not expected.
 *  3. Must throw any non-validation errors as early as possible.
 *  4. Must return the correct value passed to them. This value may be transformed.
 *
 * @see #and
 */
export interface Validator<Input, Output> {
  (value: Input): Output;

  /**
   * Creates a new validator by combining the validation logic of the this validator
   * and the provide validator, in order.
   */
  and<NewOutput>(
    validator: Validator<Output, TransferNullability<Output, NewOutput>>
  ): Validator<Input, TransferNullability<Output, NewOutput>>;
}

/**
 * An error thrown by {@link Validator}s when the input value of the validator function
 * does not match it's output type.
 */
export class ValidationError extends Error {
  /**
   * The value which failed validation.
   */
  value: unknown;

  /**
   * Reasons why the value failed. This is generally present when {@link #value} is a
   * complex object, like an array or plain-object and the validation failure is a result
   * of validation failure at one or multiple sub-validation routines.
   *
   * If {@link #value} is an Array, then this will be set if any of the elements in the
   * array does not pass validation. It will not be set if the array itself does not pass
   * some validation (eg. length, optionality, or similar). It's a 1:1 map of the elements
   * in the array that did not pass validation.
   *
   * If {@link #value} is an object, and usually this is only a plain JavaScript object,
   * then this value will be set if any of the object key-value pairs does not pass validation.
   * It will not be set if the object itself did not pass some validation (eg. xor, and,
   * optionality or similar). It's a 1:1 map of the key-value pairs in the object that did
   * not pass validation.
   */
  reasons?: ValidationError[] | { [key: string]: ValidationError; [key: number]: ValidationError };

  /**
   * Create a new {@link ValidationError} object.
   *
   * @param message the message for the validatio failure
   * @param value the value that failed validation
   * @param reasons the reasons contributing for this failed validation
   */
  constructor(
    message: string,
    value: unknown,
    reasons?: ValidationError[] | { [key: string]: ValidationError; [key: number]: ValidationError }
  ) {
    super(message);
    this.value = value;
    this.reasons = reasons;
  }
}

/**
 * Used to check if an error value is an instance of the error class provided.
 * If it is, it invokes the provided function. Otherwise, it rethrows the error.
 *
 * @param value the error value to check
 * @param error the error class to evaluate over value
 * @param func the function to invoke if value is an instance of error
 */
function isError<E extends Error, O>(
  value: Error,
  error: { new (...args: any[]): E },
  func: (error?: E) => O
): O {
  if (value instanceof error) {
    return func(value);
  }

  throw value;
}

/**
 * Wraps a general validation function with the monadic functionality of a {@link Validator}.
 *
 * The contract for the function is that it should allow optional i.e. null or undefined values,
 * while truthy values should be explicitly validated. This function may
 * throw other errors, but they will stop the validation chain immediately. This may not be
 * the case of a {@link ValidationError}, which should be the end goal of the function, where
 * the validation chain is not necessarily stopped immediately.
 *
 * @param name the debugging name of the function
 * @param func the function which should obey the contract explained above
 *
 * @return Validator a validator based on the provided function
 */
export function wrap<I, X>(name: string, func: (value: I) => X): Validator<I, X> {
  const container = {
    [name]: (value: I) => func(value)
  };

  const validatorFunction: any = container[name];

  return Object.assign(validatorFunction, {
    and: <B>(validator: Validator<X, B>): Validator<I, B> =>
      wrap<I, B>(`${name}.and(${validator.name})`, value => validator(validatorFunction(value)))
  });
}

/**
 * Wraps a boolean-returning function as a function ready-to-use in {@link #wrap}.
 *
 * Often this is used for simple validation checks, where the output of the validation check is
 * a boolean value. Examples: checking if the value is a string, object, number, an instance of,
 * or similar. It obeys the contract for {@link #wrap} in which the function is not called if
 * the value is null or undefined.
 *
 * @param bool the function that does the boolean validation check
 * @param failure the failure message for a simple {@link ValidationError}
 *
 * @return function a function ready to use in {@link #wrap}
 */
export function allow<I, X>(bool: (value: I) => boolean, failure: string) {
  return (allow: I): TransferNullability<I, X> => {
    if (undefined === allow || null === allow || bool(allow)) {
      return allow as any;
    }

    throw new ValidationError(failure, allow);
  };
}

/**
 * Wraps a transformation function as a function ready-to-use in {@link #wrap}.
 *
 * Some validator functions generally work on transforming a value to a different representation
 * (number as date, string as number) or modify it slightly (lowercased string, integer number).
 * These functions don't throw {@link ValdationError} although in some occasions this may be
 * necessary.
 *
 * @param transformer the transformation function
 *
 * @return function a function ready to use in {@link #wrap}
 */
export function transform<I, X>(transformer: (value: I) => X) {
  return (value: I): TransferNullability<I, X> => {
    if (null === value || undefined === value) {
      return value as any;
    }

    return transformer(value) as any;
  };
}

/**
 * A generic validator checking for non-null and non-undefined values. Usually the start
 * of a validation chain.
 */
export const required = () =>
  wrap<unknown, unknown>("required", value => {
    if (undefined === value || null === value) {
      throw new ValidationError("value is null or undefined", value);
    }

    return value;
  });

/**
 * A generic validator that really doesn't check for anything. It accepts every value,
 * but is important in keeping strict null typing.
 */
export const optional = <X>() =>
  wrap<unknown, X | null | undefined>("optional", value => {
    return value as any;
  });

/**
 * Validators for the `any` type.
 */
export namespace any {
  /**
   * Check that the value is of the type `any`. Which is, well, any value.
   */
  export const is = <X>() => wrap("any.is", transform<X, any>(value => value));

  /**
   * Check that the value is an instance of the constructor.
   */
  export const instance = <X, C>(constructor: { new (...args: any[]): C }) =>
    wrap(
      "any.instance",
      allow<X, C>(value => value instanceof constructor, `value not an instance of ${constructor}`)
    );

  /**
   * Check that the value is one of the provided values.
   */
  export const only = <X, O extends any[]>(...values: O) =>
    wrap(
      "any.only",
      allow<X, O extends (infer R)[] ? R : never>(
        value => values.indexOf(value as any) > -1,
        `value is not one of ${values.map(value => `${value}`).join(", ")}`
      )
    );

  /**
   * Alias for `only`. Check that the value is one of the provided values.
   */
  export const values = only;
}

/**
 * Validators for the `string` type.
 */
export namespace str {
  /**
   * Check that the value is of the `string` type. It accepts empty strings as well.
   */
  export const is = <X>() =>
    wrap("str.is", allow<X, string>(value => "string" === typeof value, "value is not string"));

  /**
   * Check that the value is of the `string` type and non-empty.
   */
  export const nonempty = <X>() =>
    wrap(
      "str.nonempty",
      allow<X, string>(
        value => "string" === typeof value && !!value,
        "value is not a non-empty string"
      )
    );

  /**
   * Check tha the string-based value has length at least `min`.
   */
  export const min = <X extends string, N extends number>(min: N) =>
    wrap(
      "str.min",
      allow<X, string>(value => value.length >= min, `value.length is lower than ${min}`)
    );

  /**
   * Check that the string-based value has length at most `max`.
   */
  export const max = <X extends string, N extends number>(max: N) =>
    wrap(
      "str.max",
      allow<X, string>(value => value.length <= max, `value.length is greater than ${max}`)
    );

  /**
   * Check that the string-based value has length in the closed range of `[min, max]`.
   */
  export const length = <X extends string, L extends number, H extends number>(min: L, max: H) =>
    wrap(
      "str.length",
      allow<X, string>(
        value => value.length >= min && value.length <= max,
        `value.length is out of bounds [${min}, ${max}]`
      )
    );

  /**
   * Check that the string-based value matches a regular expression pattern. Optionally,
   * it may do a replacement (like {@link String#replace}) based on that pattern.
   *
   * If the pattern does not match, the replacement is not carried out.
   *
   * @param pattern the pattern to match and optionally replace
   * @param replace the optional replacement string for the matching pattern
   */
  export const regex = <X extends string>(pattern: RegExp, replace?: string) =>
    wrap(
      "str.regex",
      transform<X, string>(value => {
        if (replace) {
          if (!value.match(pattern)) {
            throw new ValidationError(`value does not match ${pattern}`, value);
          }

          return value.replace(pattern, replace);
        }

        if (!value.match(pattern)) {
          throw new ValidationError(`value does not match ${pattern}`, value);
        }

        return value;
      })
    );
}

/**
 * Validators for the `number` type.
 */
export namespace num {
  /**
   * Check that the value is a `number`. It does not allow `NaN` values.
   *
   * @see #isNaN
   */
  export const is = <X>() =>
    wrap(
      "num.is",
      allow<X, number>(
        value => "number" === typeof value && !Number.isNaN(value),
        "value is not a number"
      )
    );

  /**
   * Check that the value is a `number` including `NaN`.
   */
  export const isNaN = <X>() =>
    wrap(
      "num.isNaN",
      allow<X, number>(value => "number" === typeof value, "value is not a number type")
    );

  /**
   * Check that the value is an integer.
   */
  export const isInteger = <X>() =>
    wrap(
      "num.isInteger",
      allow<X, number>(
        value => "number" === typeof value && Number.isInteger(value),
        "value is not an integer"
      )
    );

  /**
   * Transform a string-based value into a number via the {@link Number} function.
   * It will return `NaN` if unable to parse but you can pass in throwOnNaN as an option.
   */
  export const parse = <X extends string>(
    options: { throwOnNaN: boolean } = { throwOnNaN: false },
    parser: (value: X) => number = Number
  ) => {
    if (options && options.throwOnNaN) {
      return wrap("num.parse", transform<X, number>(value => parser(value))).and(is());
    } else {
      return wrap("num.parse", transform<X, number>(value => parser(value)));
    }
  };

  /**
   * Check that the number-based value is at least `min`.
   */
  export const min = <X extends number, N extends number>(min: N) =>
    wrap("num.min", allow<X, number>((value: number) => value >= min, `value is less than ${min}`));

  /**
   * Check that the number-based value is at most `max`.
   */
  export const max = <X extends number, N extends number>(max: N) =>
    wrap(
      "num.max",
      allow<X, number>((value: number) => value <= max, `value is greater than ${max}`)
    );

  /**
   * Transform a number-based value into an integer number via {@link Math#trunc}.
   */
  export const integer = <X extends number>() =>
    wrap("num.integer", transform<X, number>((value: number) => Math.trunc(value) as X));
}

/**
 * Boolean type validators.
 */
export namespace bool {
  /**
   * Check that the value is a boolean. (Does not allow non-boolean values!)
   *
   * @see #truthy
   * @see #falsy
   */
  export const is = <X>() =>
    wrap(
      "bool.is",
      allow<X, boolean>(value => "boolean" === typeof value, "value is not a boolean")
    );

  /**
   * Check that the value is strictly `true`.
   */
  export const truth = () =>
    wrap("bool.truth", allow<unknown, true>(value => true === value, "value is not true"));

  /**
   * Check that the value is strictly `false`.
   */
  export const falseness = () =>
    wrap("bool.falseness", allow<unknown, false>(value => false === value, "value is not false"));

  /**
   * Transform any value into its truthy boolean equivalent.
   */
  export const truthy = <X>() => wrap("bool.truthy", transform<X, boolean>(value => !!value));

  /**
   * Transform any value into its falsy boolean equivalent.
   */
  export const falsy = <X>() => wrap("bool.falsy", transform<X, boolean>(value => !value));
}

/**
 * Validators for functions.
 */
export namespace func {
  /**
   * Check that the value is a function.
   */
  export const is = <X>() =>
    wrap(
      "func.is",
      allow<X, (...args: unknown[]) => unknown>(
        value => "function" === typeof value,
        "value is not a function"
      )
    );
}

/**
 * Validators for {@link Array}s.
 */
export namespace array {
  /**
   * Check that the value is an {@link Array} via {@link Array#isArray}.
   */
  export const is = <X>() =>
    wrap("array.is", allow<X, unknown[]>(value => Array.isArray(value), "value is not an array"));

  /**
   * Check that the array-based value is a homogenous array of items as validated
   * by the provided item-level validator. This validator may transform the array
   * into a different shape. The validator is run on all items before throwing a
   * {@link ValidatonError}. The {@link ValidationError#reason} filed will be set
   * with reasons for the items which failed validation. If the item-level validator
   * does not transform any values, then the original value is passed along.
   *
   * @param items the item-level validator
   */
  export const items = <Y, X extends Y[], Z>(items: Validator<Y, Z>) =>
    wrap<X, Z[]>("array.items", value => {
      if (!value) {
        return value;
      }

      let output: Z[] | null = null;
      let reasons: ValidationError[] | null = null;

      for (let index = 0; index < value.length; index += 1) {
        try {
          const item = value[index];
          const transformed = items(item);

          if ((transformed as unknown) !== (item as unknown) && !output) {
            output = new Array(value.length);

            for (let j = 0; j < index; j += 1) {
              output[j] = value[j] as any;
            }
          }

          if (output) {
            output[index] = transformed;
          }
        } catch (error) {
          isError(error, ValidationError, () => {
            if (!reasons) {
              reasons = new Array(value.length);
            }

            reasons[index] = error;
          });
        }
      }

      if (reasons) {
        throw new ValidationError("value is an array of invalid items", value, reasons);
      }

      if (output) {
        return output;
      }

      return value as any;
    });

  /**
   * Check that the array-based value has length of at least `min`.
   */
  export const min = <Y, X extends Y[], N extends number>(min: N) =>
    wrap(
      "array.min",
      allow<X, X>(value => value.length >= min, `value.length is smaller than ${min}`)
    );

  /**
   * Check that the array-based value has length of at most `max`.
   */
  export const max = <Y, X extends Y[], N extends number>(max: N) =>
    wrap(
      "array.max",
      allow<X, X>(value => value.length <= max, `value.length is greater than ${max}`)
    );

  /**
   * Check that the array-based value has length in the closed range of `[min, max]`.
   */
  export const length = <Y, X extends Array<Y>, L extends number, H extends number>(
    min: L,
    max: H
  ) =>
    wrap(
      "array.length",
      allow<X, X>(
        value => value.length >= min && value.length <= max,
        `value.length is out of bounds [${min}, ${max}]`
      )
    );
}

/**
 * Validators for objects.
 */
export namespace obj {
  /**
   * Checks that the value is a JavaScript object excluding `null`.
   * Usually when validating HTTP body input you want to use toi.obj.isplain() as that
   * can mitigate some prototype-pollution attacks.
   */
  export const is = <X>() =>
    wrap(
      "obj.is",
      allow<X, object>(
        value => null !== value && "object" === typeof value,
        `value is not an object type`
      )
    );

  /**
   * Checks that the object is a plain JavaScript object, i.e. an object whose
   * prototype is Object.prototype and no attempt has been made to insert a
   * __proto__ property as a way to change the object's prototype. `null` is not regarded
   * as an object, though it is.
   */
  export const isplain = <X>() =>
    wrap(
      "obj.isplain",
      allow<X, object>(
        value =>
          null !== value &&
          "object" === typeof value &&
          !Object.getOwnPropertyDescriptor(value, "__proto__") &&
          Object.prototype === Object.getPrototypeOf(value),
        "value is not an object or its prototype is not Object.prototype"
      )
    );

  /**
   * Checks that the value is a Number object.
   */
  export const number = <X extends object>() =>
    wrap(
      "obj.number",
      allow<X, Number>(
        value => null != value && "object" === typeof value && value instanceof Number,
        "value is not a Number object"
      )
    );

  /**
   * Checks that the value is a String object.
   */
  export const string = <X extends object>() =>
    wrap(
      "obj.string",
      allow<X, String>(
        value => null != value && "object" === typeof value && value instanceof String,
        "value is not a String object"
      )
    );

  /**
   * Checks that the value is a Boolean object.
   */
  export const boolean = <X extends object>() =>
    wrap(
      "obj.boolean",
      allow<X, Boolean>(
        value => null != value && "object" === typeof value && value instanceof Boolean,
        "value is not a Boolean object"
      )
    );

  /**
   * Checks that the value is an Array object.
   */
  export const array = <X extends object>() =>
    wrap(
      "obj.array",
      allow<X, Array<unknown>>(
        value => null != value && "object" === typeof value && value instanceof Array,
        "value is not an Array object"
      )
    );

  /**
   * Extract the primitive type out of an object. You must first use one of `toi.obj.number`,
   * `toi.obj.string`, `toi.obj.boolean`, or `toi.obj.array` to properly infer the output
   * primitive.
   */
  export const primitive = <X extends object>() =>
    wrap(
      "obj.primitive",
      transform<
        X,
        X extends Number
          ? number
          : (X extends String
              ? string
              : (X extends Boolean ? boolean : (X extends (infer E)[] ? E[] : object)))
      >(value => value.valueOf() as any)
    );

  /**
   * Checks that the object obeys a strict structure of properties and property-level validators.
   *
   * It is a strict 1:1 validation. Keys not found on the value will trigger a {@link ValidationError},
   * including keys found in the `value` but not in the structure.
   *
   * The `value` is never returned as-is, but is made a copy of with the own properties according to
   * the defined `structure`. Therefore, the property-level validators may transform the property
   * values. This safeguards from `instanceof` checks, including prototype-hijacking and similar
   * issues.
   *
   * @param structure the definition structure of the object
   * @param options the validation options, like optional (missing) fields
   */
  export const keys = <X extends object, Y>(
    structure: { [K in keyof Y]: Validator<any, Y[K]> },
    options?: { missing?: (keyof Y)[] }
  ) => {
    const missing: { [key in keyof Y]?: true } = {};

    if (options && options.missing && options.missing.length > 0) {
      for (let i = 0; i < options.missing.length; i += 1) {
        missing[options.missing[i]] = true;
      }
    }

    return wrap<X, Y>("obj.keys", value => {
      if (null === value || undefined === value) {
        return value;
      }

      let reasons: {
        [key: string]: ValidationError;
        [key: number]: ValidationError;
      } | null = null;

      const output: any = {};

      for (let key in structure) {
        try {
          if (!Object.getOwnPropertyDescriptor(value, key)) {
            if (!missing[key]) {
              throw new ValidationError(`key ${key} in value is missing`, key);
            } else {
              // still run the validator even if the value is missing, so that if
              // someone has said that the key can be missing but they've put a required validator
              // the validation will fail
              output[key] = (structure as any)[key]((value as any)[key]);
            }
          } else {
            output[key] = (structure as any)[key]((value as any)[key]);
          }
        } catch (error) {
          isError(error, ValidationError, () => {
            if (!reasons) {
              reasons = {};
            }

            reasons[key] = error;
          });
        }
      }

      if (reasons) {
        throw new ValidationError("value does not match structure", value, reasons);
      }

      return output;
    });
  };

  /**
   * Transform an object by adding default values to the obeject. Always creates a copy
   * of the object.
   */
  export const defaults = <X extends object>(defaults: { [K in keyof X]?: X[K] }) =>
    wrap("obj.defaults", transform<X, X>(value => Object.assign({}, defaults, value)));

  /**
   * Allow only one of the keys in the list to be present on the object. Presence
   * does not mean non-null or non-undefined.
   */
  export const xor = <X extends object>(fields: (keyof X)[]) =>
    wrap(
      "obj.xor",
      allow<X, X>(value => {
        const valueKeys = Object.keys(value);

        const xorValue = fields
          .map(field => valueKeys.indexOf(field as string) + 1)
          .reduce((a, i) => a + i, 0);

        return 1 === xorValue;
      }, `value must have only one field present of ${fields.join(", ")}`)
    );

  /**
   * Allow only when all of the keys in the list are present on the object. Presence
   * does not mean non-null or non-undefined.
   */
  export const and = <X extends object>(fields: (keyof X)[]) =>
    wrap<X, X>("obj.and", value => {
      if (null === value || undefined === value) {
        return value;
      }

      let reasons: { [key in keyof X]?: ValidationError } | null = null;

      const valueKeys = Object.keys(value);

      fields.forEach((key: keyof X) => {
        try {
          if (valueKeys.indexOf(key as any) < 0) {
            throw new ValidationError("field must be present", value[key]);
          }
        } catch (error) {
          isError(error, ValidationError, () => {
            if (!reasons) {
              reasons = {};
            }

            reasons[key] = error;
          });
        }
      });

      if (reasons) {
        throw new ValidationError(
          `value must contain all of the fields ${fields.join(", ")}`,
          value,
          reasons
        );
      }

      return value;
    });
}

/**
 * {@link Date} validators.
 */
export namespace date {
  /**
   * Check that the value is a valid {@link Date}, i.e. an instance of {@link Date}
   * and where {@link Date#getTime} is not `NaN`.
   */
  export const is = <X>() =>
    wrap(
      "date.is",
      allow<X, Date>(
        value =>
          "object" === typeof value &&
          value instanceof Date &&
          "number" === typeof value.getTime() &&
          !Number.isNaN(value.getTime()),
        `value is not a date or valid date`
      )
    );

  /**
   * Parse a date out of a string-based value via {@link Date#parse}.
   */
  export const parse = <X extends string>() =>
    wrap(
      "date.parse",
      transform<X, Date>(value => {
        return new Date(value);
      })
    ).and(is());

  /**
   * Parse out a date out of a number-based value which represents UNIX milliseconds
   * in UTC.
   */
  export const milliseconds = <X extends number>() =>
    wrap(
      "date.milliseconds",
      transform<X, Date>(value => {
        return new Date(value);
      })
    ).and(is());

  /**
   * Parse out a date out of a number-based value which represent UNIX seconds in UTC.
   */
  export const seconds = <X extends number>() =>
    wrap(
      "date.seconds",
      transform<X, Date>(value => {
        return new Date(value * 1000);
      })
    ).and(is());
}
