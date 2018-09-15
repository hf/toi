/**
 * ToiX -- extra validators for Toi.
 */

import { wrap, allow, transform } from "@toi/toi";
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
}
