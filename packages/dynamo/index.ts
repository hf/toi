/**
 * Contains transformers for DynamoDB values.
 *
 * DynamoDB values have the following (pretty ugly) form:
 *
 * Strings: { S: value }
 * String Sets: { SS: [value, value, ...] }
 * Numbers: { N: value as string }
 * Number Sets: { NS: [value as string, value as string, ... ] }
 * Boolean: { BOOL: value }
 * Null: { NULL: true }
 * Binary: { B: Buffer | TypedArray | value as base64 string }
 * Binary Sets: { BS: [ Buffer | TypedArray | value as base64 string ] }
 * Lists: { L: [ other values like these, ... ] }
 * Maps: { M: { Name: other values like these, ... } }
 *
 * These transformers enable you to extract all meaningful information from
 * such verbose objects while being typesafe. (You can also add other Toi
 * validators on top to create rich objects!)
 */

import * as toi from "@toi/toi";
import * as toix from "@toi/toix";

/**
 * DynamoDB stores numbers as strings in order to increase number compatibility
 * with other languages. (JavaScript numebrs are floating point, and therefore
 * at most 53 bits long as integers.)
 *
 * This is a branded type that tells Toi's Dynamo that although it's a string,
 * it really means a number.
 */
export type DynamoNumber = string & { __brand_represents: number };

/**
 * Checks for DynamoDB's dreaded { NULL: true } object and returns null.
 */
export const nullable = <X>() =>
  toi.wrap(
    "dynamo.nullable",
    toi.transform<X, X>(value => {
      if ("object" === typeof value) {
        const properties = Object.getOwnPropertyNames(value);

        if (1 === properties.length) {
          const name = properties[0];

          if ("NULL" === name) {
            const descriptor = Object.getOwnPropertyDescriptor(value, name);

            if (
              descriptor &&
              descriptor.enumerable &&
              !descriptor.set &&
              !descriptor.get &&
              true === descriptor.value
            ) {
              return null as any;
            }
          }
        }
      }

      return value;
    })
  );

const returnNull = () => toi.wrap("dynamo.null", toi.transform(() => null));

/**
 * Extracts null from the dreaded { NULL: true } DynamoDB value.
 * (But only null and does not accept anything else!)
 */
export const isnull = () =>
  toi.obj
    .is()
    .and(toi.obj.keys({ NULL: toi.required().and(toi.bool.truth()) }))
    .and(returnNull());

/**
 * Transformers for the { S: string } DynamoDB value.
 */
export namespace str {
  /**
   * Pick the value from a { S: string } DynamoDB value. You should usually use dynamo.str.is() instead.
   */
  export const pick = <X extends { S: string }>() =>
    toi.wrap("dynamo.s", toi.transform<X, string>(value => value.S));

  /**
   * Expect either a DynamoDB null or string value.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.is())
      .and(
        toi.obj.keys({
          S: toi.required().and(toi.str.is())
        })
      )
      .and(pick());
}

/**
 * Transformers for the String Set { SS: [ string, ... ] } DynamoDB value.
 */
export namespace strset {
  /**
   * Pick the value from a { SS: [ string, ... ] } DynamoDB value. You should usually use dynamo.strset.is() instead.
   */
  export const pick = <X extends { SS: string[] }>() =>
    toi.wrap("dynamo.ss", toi.transform<X, string[]>(value => value.SS));

  /**
   * Extract either a DynamoDB null or [ string, ... ] value.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.is())
      .and(
        toi.obj.keys({
          SS: toi
            .required()
            .and(toi.array.is())
            .and(toi.array.min(1))
            .and(toi.array.items(toi.str.is()))
        })
      )
      .and(pick());
}

/**
 * Transformers for the Number { N: number as string } DynamoDB value.
 */
export namespace num {
  /**
   * Pick the value from a { N: number as string } DynamoDB value. You should usually use dynamo.num.is() instead.
   */
  export const pick = <X extends { N: string }>() =>
    toi.wrap(
      "dynamo.n",
      toi.transform<X, DynamoNumber>(value => value.N as DynamoNumber)
    );

  /**
   * Check the number formatting.
   */
  export const format = () =>
    toi.str.regex(
      /^(0|0.0|-?0[.][0-9]*([1-9]$)|-?[1-9][0-9]*([.][0-9]*([1-9]$))?)$/
      // A BBB CCDDDDDDDDDDDDDDDDDD EEEEEEEEEEEEE FFFFFFFFF GGGGGG  G
      // A - "0"
      // B - "0.0"
      // C - possible negative 0.xxx
      // D - 0.xxxx where the last one is not a 0
      // E - (possibly negative) integer that starts with 1
      // F - possible fractional part that contains 0s but can't end on 0 and must be at least 1 digit
    );

  /**
   * Extract either a DynamoDB null or number value. However, the value will be encoded as
   * DynamoNumber, which is a branded string.
   *
   * Please use dynamo.num.parse() to parse the value into a JavaScript number however
   * MAKE SURE YOU UNDERSTAND THAT JAVASCRIPT NUMBERS ARE FLOATING POINT AND THEREFORE
   * CAN REPRESENT ONLY 53 BIT SIGNED INTEGERS. If parsing has failed, it will return NaN.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.isplain())
      .and(
        toi.obj.keys({
          N: toi
            .required()
            .and(toi.str.is())
            .and(format())
        })
      )
      .and(pick());

  /**
   * Parse a DynamoNumber into a number using toi.num.parse.
   */
  export const parse = <X extends DynamoNumber>() => toi.num.parse<X>();
}

/**
 * Transformers for the Number Set { NS: [ value as string, ... ] } DynamoDB value.
 */
export namespace numset {
  /**
   * Pick the value from a { NS: [ value as string ] } DynamoDB value. You should usually use dynamo.numset.is() instead.
   */
  export const pick = <X extends { NS: string[] }>() =>
    toi.wrap(
      "dynamo.ns",
      toi.transform<X, DynamoNumber[]>(value => value.NS as DynamoNumber[])
    );

  /**
   * Extract either a DynamoDB null or number set values as DynamoNumber[].
   */
  export const is = () =>
    nullable()
      .and(toi.obj.isplain())
      .and(
        toi.obj.keys({
          NS: toi
            .required()
            .and(toi.array.is())
            .and(toi.array.min(1))
            .and(
              toi.array.items(
                toi.required().and(toi.str.is().and(num.format()))
              )
            )
        })
      )
      .and(pick());
}

/**
 * Transformers for Boolean { BOOL: boolean } DynamoDB values.
 */
export namespace bool {
  /**
   * Pick the boolean value from a { BOOL: boolean } DynamoDB value. You should usually use dynamo.bool.is() instead.
   */
  export const pick = <X extends { BOOL: boolean }>() =>
    toi.wrap("dynamo.bool", toi.transform<X, boolean>(value => value.BOOL));

  /**
   * Extract either a DynamoDB null or boolean value.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.isplain())
      .and(
        toi.obj.keys({
          BOOL: toi.required().and(toi.bool.is())
        })
      )
      .and(pick());
}

/**
 * Transformers for { B: base64 string } DynamoDB values.
 */
export namespace bin {
  /**
   * Extract a Buffer from the { B: base64 string } DynamoDB value. You should usually use dynamo.bin.is() instead.
   */
  export const pick = <V extends string, X extends { B: V }>() =>
    toi.wrap(
      "dynamo.b",
      toi.transform<X, Buffer>(value => {
        return Buffer.from(value.B, "base64");
      })
    );

  /**
   * Extract either a DynamoDB null or Buffer value.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.isplain())
      .and(
        toi.obj.keys({
          B: toi
            .required()
            .and(toi.str.is())
            .and(toix.str.isbase64("rfc4648"))
        })
      )
      .and(pick());
}

/**
 * Transformers for binary set { BS: [ base64 string, ... ] } values.
 */
export namespace binset {
  /**
   * Pick buffers from the { BS: [ base64 string, ... ] } values. You should usually use dynamo.binset.is() instead.
   */
  export const pick = <X extends { BS: string[] }>() =>
    toi.wrap(
      "dynamo.bs",
      toi.transform<X, Buffer[]>(value =>
        value.BS.map(i => Buffer.from(i, "base64"))
      )
    );

  /**
   * Pick either a DynamoDB null or binary set value.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.isplain())
      .and(
        toi.obj.keys({
          BS: toi
            .required()
            .and(toi.array.is())
            .and(toi.array.min(1))
            .and(
              toi.array.items(
                toi
                  .required()
                  .and(toi.str.is())
                  .and(toix.str.isbase64("rfc4648"))
              )
            )
        })
      )
      .and(pick());
}

/**
 * Transformers for working with DynamoDB lists { L: [ any dynamodb value, ... ] }.
 *
 * These lists contain other DynamoDB values, so they need to be mapped properly with toi.array.* validators.
 */
export namespace list {
  /**
   * Pick the list from a { L: [ any dynamodb value, ...] } value.
   * You should usually use dynamo.list.is() instead.
   */
  export const pick = <X extends { L: unknown[] }>() =>
    toi.wrap("dynamo.l", toi.transform<X, unknown[]>(value => value.L));

  /**
   * Extract either a DynamoDB null or an array of DynamoDB values.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.isplain())
      .and(
        toi.obj.keys({
          L: toi.required().and(toi.array.is())
        })
      )
      .and(pick());
}

/**
 * Transformers for working with DynamoDB maps { M: { [key: string]: dynamo value } }.
 *
 * These litst contain other DynamoDB values, so they need to be mapped properly with toi.obj.* and other validators.
 */
export namespace map {
  /**
   * Pick the map from a { M: [key: string]: dynamo value } DynamoDB value.
   * You should usually use dynamo.map.is() instead.
   */
  export const pick = <X extends { M: object }>() =>
    toi.wrap("dynamo.m", toi.transform<X, object>(value => value.M));

  /**
   * Check that the map has proper keys. Usually you should use dynamo.map.is() instead.
   */
  export const properKeys = <X extends object>() =>
    toi.wrap(
      "dynamo.map.properKeys",
      toi.transform<X, object>(value => {
        const keys = Object.getOwnPropertyNames(value);
        const reasons: toi.ValidationError[] = [];
        let hasError = false;

        for (let i = 0; i < keys.length; i += 1) {
          if ("string" !== typeof keys[i] || !keys[i]) {
            hasError = true;
            reasons[i] = new toi.ValidationError(
              `key at position ${i} with name '${
                keys[i]
              }' is not a string or is empty`,
              keys[i]
            );
          }
        }

        if (hasError) {
          throw new toi.ValidationError(
            `map has improper keys`,
            value,
            reasons
          );
        }

        return value as any;
      })
    );

  /**
   * Extract either a DynamoDB null or an object with DynamoDB values.
   */
  export const is = () =>
    nullable()
      .and(toi.obj.isplain())
      .and(
        toi.obj.keys({
          M: toi
            .required()
            .and(toi.obj.is())
            .and(properKeys())
        })
      )
      .and(pick());
}
