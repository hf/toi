import "mocha";

import * as toi from "@toi/toi";
import * as toix from "./index";

function equality(a: any, b: any): boolean {
  if (isNaN(a) && isNaN(b)) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.reduce((a, i, index) => a && i == b[index], true)
    );
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  return a === b;
}

function inspect(value: any): string {
  if ("string" === typeof value) {
    return `"${value}"`;
  } else if ("number" === typeof value) {
    return `${value}`;
  } else if ("undefined" === typeof value) {
    return "undefined";
  } else if (null === value) {
    return "null";
  } else if (Array.isArray(value)) {
    return `[ ${value.map(item => inspect(item)).join(", ")} ]`;
  } else if ("object" === typeof value) {
    if (value instanceof String) {
      return `String("${value.valueOf()}")`;
    } else if (value instanceof Number) {
      return `Number(${value.valueOf()})`;
    } else if (value instanceof Boolean) {
      return `Boolean(${value.valueOf()})`;
    } else if (value instanceof Date) {
      return `Date(${value.getTime()})`;
    } else {
      return `{ ${Object.keys(value)
        .map(key => `${inspect(key)}: ${inspect(value[key])}`)
        .join(", ")} }`;
    }
  } else {
    return `${value}`;
  }
}

function assert(
  validator: toi.Validator<any, any>,
  options: {
    positive?: any[];
    negative?: any[];
  },
  lenient = false
) {
  if (!lenient) {
    it(`should allow null`, () => validator(null));
    it(`should allow undefined`, () => validator(undefined));
  }

  (options.positive || []).forEach(value => {
    it(`should allow ${inspect(value)}`, () => validator(value));
  });

  (options.negative || []).forEach(value => {
    it(`should not allow ${inspect(value)}`, () => {
      try {
        validator(value);
        throw new Error(`Allowed!`);
      } catch (error) {
        if (error instanceof toi.ValidationError) {
          return;
        }
        throw error;
      }
    });
  });
}

function transform<I, O>(
  validator: toi.Validator<I, O>,
  options: {
    positive?: [I, O][];
    negative?: I[];
  }
) {
  it(`should transform undefined into undefined`, () => {
    if (undefined !== validator(undefined as any)) {
      throw new Error("Did not transform!");
    }
  });

  it(`should transform null into null`, () => {
    if (null !== validator(null as any)) {
      throw new Error("Did not transform!");
    }
  });

  (options.positive || []).forEach(pair => {
    const input = pair[0];
    const output = pair[1];

    it(`should transform ${inspect(input)} into ${inspect(output)}`, () => {
      const transformed = validator(input);

      if (!equality(output, transformed)) {
        throw new Error("Did not transform!");
      }
    });
  });

  (options.negative || []).forEach(value => {
    it(`should not transform ${inspect(value)}`, () => {
      try {
        validator(value);
        throw new Error("Transformed!");
      } catch (error) {
        if (error instanceof toi.ValidationError) {
          return error;
        }
        throw error;
      }
    });
  });
}

describe("toix", () => {
  describe("str", () => {
    describe("email()", () => {
      assert(toix.str.email(), {
        positive: ["hello@example.com"],
        negative: ["", "@"]
      });
    });

    describe("guid()", () => {
      assert(toix.str.guid(), {
        positive: [
          "00000000-0000-1000-0000-000000000000",
          "00000000-0000-2000-0000-000000000000",
          "00000000-0000-3000-0000-000000000000",
          "00000000-0000-4000-0000-000000000000",
          "00000000-0000-5000-0000-000000000000",
          "00000000-0000-6000-0000-000000000000",
          "00000000-0000-7000-0000-000000000000",
          "00000000-0000-8000-0000-000000000000",
          "00000000-0000-9000-0000-000000000000",
          "00000000-0000-a000-0000-000000000000",
          "00000000-0000-b000-0000-000000000000",
          "00000000-0000-c000-0000-000000000000",
          "00000000-0000-d000-0000-000000000000",
          "00000000-0000-e000-0000-000000000000",
          "00000000-0000-f000-0000-000000000000"
        ],
        negative: [
          "",
          "00000000-0000-0000-0000-000000000000",
          "00000000-0000-g000-0000-000000000000",
          "00000000-0000-0000-4000-0000000000000",
          "00000000-0000-0000-4000-00000000000"
        ]
      });
    });

    describe("guid({ allowNil: true })", () => {
      assert(toix.str.guid({ allowNil: true }), {
        positive: ["00000000-0000-0000-0000-000000000000"]
      });
    });

    describe("guid({ version: 4 })", () => {
      assert(toix.str.guid({ version: 4 }), {
        positive: ["00000000-0000-4000-0000-000000000000"],
        negative: [
          "00000000-0000-0000-0000-000000000000",
          "00000000-0000-1000-0000-000000000000",
          "00000000-0000-2000-0000-000000000000",
          "00000000-0000-3000-0000-000000000000",
          "00000000-0000-5000-0000-000000000000",
          "00000000-0000-6000-0000-000000000000",
          "00000000-0000-7000-0000-000000000000",
          "00000000-0000-8000-0000-000000000000",
          "00000000-0000-9000-0000-000000000000",
          "00000000-0000-a000-0000-000000000000",
          "00000000-0000-b000-0000-000000000000",
          "00000000-0000-c000-0000-000000000000",
          "00000000-0000-d000-0000-000000000000",
          "00000000-0000-e000-0000-000000000000",
          "00000000-0000-f000-0000-000000000000"
        ]
      });
    });

    describe("guid({ version: 4, allowNil: true })", () => {
      assert(toix.str.guid({ version: 4, allowNil: true }), {
        positive: [
          "00000000-0000-4000-0000-000000000000",
          "00000000-0000-0000-0000-000000000000"
        ],
        negative: [
          "00000000-0000-1000-0000-000000000000",
          "00000000-0000-2000-0000-000000000000",
          "00000000-0000-3000-0000-000000000000",
          "00000000-0000-5000-0000-000000000000",
          "00000000-0000-6000-0000-000000000000",
          "00000000-0000-7000-0000-000000000000",
          "00000000-0000-8000-0000-000000000000",
          "00000000-0000-9000-0000-000000000000",
          "00000000-0000-a000-0000-000000000000",
          "00000000-0000-b000-0000-000000000000",
          "00000000-0000-c000-0000-000000000000",
          "00000000-0000-d000-0000-000000000000",
          "00000000-0000-e000-0000-000000000000",
          "00000000-0000-f000-0000-000000000000"
        ]
      });
    });

    describe("hostname()", () => {
      assert(toix.str.hostname(), {
        positive: [
          "google.com",
          "example.com.mk",
          "xn--80apaahi7a3c.xn--d1alf"
        ],
        negative: [
          "кирилица.мкд",
          " google.com ",
          "some_thing.com",
          "example",
          "Google.Com",
          "http://google.com"
        ]
      });
    });

    describe("is_url()", () => {
      assert(toix.str.is_url(), {
        positive: [
          "http://www.google.com",
          "https://www.google.com",
          "http://google.com",
          "http://www.google.com/imghp",
          "http://g.co"
        ],
        negative: [
          "www.google",
          // "http://www.google",
          "http://google",
          "www.google#.com",
          "www.google-.co",
          "www.-google.co"
        ]
      });
    });

    describe("lowercase()", () => {
      transform(toix.str.lowercase(), {
        positive: [["", ""], ["hello", "hello"], ["HELLO", "hello"]]
      });
    });

    describe("uppercase()", () => {
      transform(toix.str.uppercase(), {
        positive: [["", ""], ["HELLO", "HELLO"], ["hello", "HELLO"]]
      });
    });

    describe("trim()", () => {
      transform(toix.str.trim(), {
        positive: [["", ""], ["a", "a"], ["a ", "a"], [" a", "a"], [" a ", "a"]]
      });
    });

    describe("phoneNumber()", () => {
      assert(toix.str.phoneNumber(), {
        positive: ["+8006927753", "+3891234567", "8006927753"],
        negative: ["+012", "+1", "+", "1", "+1234567891234567"]
      });
    });
  });
});
