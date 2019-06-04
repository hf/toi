/**
 * ToiX -- extra validators for Toi.
 */

import { wrap, allow, transform, ValidationError } from "@toi/toi";
import * as isemail from "isemail";

/**
 * Extra string validators for Toi.
 */
export namespace str {
  /**
   * Checks that the value is an email. Uses the "isemail" module.
   */
  export const email = <X extends string>() =>
    wrap(
      "str.email",
      allow<X, X>(
        value =>
          true ===
          isemail.validate(value, {
            errorLevel: false
          }),
        "value is not an email"
      )
    );

  /**
   * Checks for a valid URL. Accepts an URL, and optional
   * parameters like protocol and port.
   */
  export const url = <X extends string, R extends string, O extends string>(
    options: { protocol?: R; port?: O } = {}
  ) =>
    wrap(
      "str.url",
      transform<X, URL & { protocol: R; port: O }>(value => {
        try {
          const url = new URL(value);

          if (options && options.port && options.port !== url.port) {
            throw new ValidationError(`Invalid port: ${options.port}`, value);
          }

          if (
            options &&
            options.protocol &&
            options.protocol !== url.protocol
          ) {
            throw new ValidationError(
              `Invalid protocol: ${options.protocol}`,
              value
            );
          }

          return url as URL & { protocol: R; port: O };
        } catch (error) {
          if (error instanceof TypeError) {
            throw new ValidationError("Not a valid URL", value);
          }

          throw error;
        }
      })
    );

  /**
   * Checks for a valid URL. Accepts an URL as string. Uses the 'URL()' constructor for validation.
   */
  export const urlAsString = <X extends string>() =>
    wrap(
      "str.urlAsString",
      transform<X, string>(value => {
        try {
          new URL(value);
          return value;
        } catch (error) {
          // it will always be a type error
          throw new ValidationError("Not a valid URL", value);
        }
      })
    );

  /**
   * Checks that the value is a GUID. By default it accepts any version of GUID and does not
   * accept the nil GUID "00000000-0000-0000-0000-000000000000". Accepts only lowercase
   * GUIDs.
   *
   * Use the options `version` and `allowNil` to control the version number.
   */
  export const guid = <X extends string>(options?: {
    version?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
    allowNil?: boolean;
  }) =>
    wrap(
      "str.guid",
      allow<X, X>(value => {
        const match = value.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );

        if (!match) {
          return false;
        }

        const ver = parseInt(match[1].toLowerCase(), 16);

        if (0 === ver) {
          if (options && options.allowNil) {
            return !!value.match(/^[0-]{36}$/);
          }

          return false;
        }

        return !options || !options.version || options.version === ver;
      }, `value is not a uuid${options && options.version ? ` version ${options.version}` : ""}${options && options.allowNil ? " or nil" : ""}`)
    );

  /**
   * Checks that the value is a hostname. Allows only lowercase values.
   */
  export const hostname = <X extends string>() =>
    wrap(
      "str.hostname",
      allow<X, X>(
        value => !!value.match(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/),
        "value is not a hostname"
      )
    );

  /**
   * Checks that the value begins with the characters of the specified string. Uses "String.startsWith()".
   */
  export const startsWith = <X extends string>(start: string) =>
    wrap(
      "str.startsWith",
      allow<X, X>(
        value => !!value.startsWith(start),
        `value does not start with: ${start}`
      )
    );

  /**
   * Checks that the value ends with the characters of the specified string. Uses "String.endsWith()".
   */
  export const endsWith = <X extends string>(end: string) =>
    wrap(
      "str.endsWith",
      allow<X, X>(
        value => !!value.endsWith(end),
        `value does not end with: ${end}`
      )
    );

  /**
   * Checks that the value contains the characters of the specified string in sequence. Uses "String.includes()".
   */
  export const contains = <X extends string>(part: string) =>
    wrap(
      "str.contains",
      allow<X, X>(
        value => !!value.includes(part),
        `value does not contain: ${part}`
      )
    );

  /**
   * Lowercases a string.
   */
  export const lowercase = <X extends string>() =>
    wrap("str.lowercase", transform<X, string>(value => value.toLowerCase()));

  /**
   * Uppercases a string.
   */
  export const uppercase = <X extends string>() =>
    wrap("str.uppercase", transform<X, string>(value => value.toUpperCase()));

  /**
   * Trims a string.
   */
  export const trim = <X extends string>() =>
    wrap("str.trim", transform<X, string>(value => value.trim()));

  /**
   * Checks that a string is a E.164 phone number, i.e. starts with `+` (optional)
   * a non-zero digit, and followed by a minimum of 3, 2, or 1 digit, at a maximum
   * of 15 digits.
   */
  export const phoneNumber = <X extends string>() =>
    wrap(
      "str.phoneNumber",
      allow<X, X>(
        value =>
          !!value.match(/^\+?[1-9]([0-9]{3,14}|[0-9]{2,14}|[0-9]{1,14})$/),
        "value does not match E.164 numbering plan"
      )
    );

  /**
   * Checks that a string contains a valid Base64 encoding.
   *
   * There are two supported variants "rfc4648" ("default") and "rfc4648-url" ("url") that
   * follow the RFC4648 Base64 encoding standard. It's important to note that this
   * RFC does not support adding spaces, CR or LF characters in the string!
   * That is RFC2045 which is not supported by this function at this time.
   *
   * This function also strictly checks the number of characters -- the string length
   * must be a multiple of 4 with padding as necessary (and when required).
   */
  export const isbase64 = <X extends string>(
    variant: "default" | "rfc4648" | "url" | "rfc4648-url" = "rfc4648"
  ) => {
    if ("default" === variant || !variant) {
      variant = "rfc4648";
    } else if ("url" === variant) {
      variant = "rfc4648-url";
    }

    let regex: RegExp;

    if ("rfc4648" === variant) {
      regex = /^([a-z0-9\/+]{4})*($|[a-z0-9\/+]{3}=$|[a-z0-9\/+]{2}==$)$/i;
    } else if ("rfc4648-url" === variant) {
      regex = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}=?$|[a-z0-9_-]{2}(==)?$)$/i;
    } else {
      throw new Error(`Unknown Base64 variant ${variant}`);
    }

    return wrap(
      "str.isbase64",
      allow<X, X>(
        value => !!value.match(regex),
        `value is not a valid ${variant} base64, it should match ${regex}`
      )
    );
  };
}

/**
 * Extra validators for boolean values.
 */
export namespace bool {
  /**
   * Parses a string value into a boolean via the following rules:
   *
   * true: Y, YES, T, TRUE, 1 (case insensitive)
   * false: N, NO, F, FALSE, 0 (case insensitive)
   */
  export const parse = <X extends string>() =>
    wrap(
      "bool.parse",
      transform<X, boolean | null>(value => {
        const match = value.match(
          /^((YES|TRUE|ON|Y|T|1)|(NO|FALSE|OFF|N|F|0))$/i
        );

        if (!match) {
          throw new ValidationError(
            "value does not match Y, N, Yes, No, T, F, True, False, On, Off, 1, 0 (case insensitive)",
            value
          );
        }

        if (match[2]) {
          return true;
        }

        return false;
      })
    );
}

/**
 * JSON parsing, stringifying.
 */
export namespace json {
  /**
   * Parse a string into an unknown JS value.
   */
  export const parse = <X extends string>(
    parser: (text: X) => unknown = JSON.parse
  ) =>
    wrap(
      "json.parse",
      transform<X, unknown>(value => {
        try {
          return parser(value);
        } catch (error) {
          throw new ValidationError("invalid json", value, error);
        }
      })
    );

  /**
   * Stringify some unknown JS value to a JSON string.
   */
  export const stringify = <X>(
    stringifier: (value: X) => string = JSON.stringify
  ) =>
    wrap("json.stringify", transform<X, string>(value => stringifier(value)));
}
