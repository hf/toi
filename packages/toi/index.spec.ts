import "mocha";

import * as toi from "./index";

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

describe("toi", () => {
  describe("required", () => {
    assert(
      toi.required(),
      {
        positive: [0, "", NaN, {}, []],
        negative: [null, undefined]
      },
      true
    );
  });

  describe("optional", () => {
    assert(toi.optional(), {
      positive: [null, undefined, 0, "", NaN, {}, []]
    });
  });

  describe("any", () => {
    assert(toi.any.is(), {
      positive: [null, undefined, 0, "", NaN, {}, []]
    });

    assert(toi.any.instance(Date), {
      positive: [new Date()],
      negative: [
        {},
        [],
        0,
        "",
        NaN,
        false,
        {},
        [],
        new String(),
        new Number(),
        new Boolean()
      ]
    });

    assert(toi.any.only("a", "b", "c"), {
      positive: ["a", "b", "c"],
      negative: [
        0,
        NaN,
        new String("a"),
        new String("b"),
        new String("c"),
        false,
        {},
        []
      ]
    });

    assert(toi.any.values("a", "b", "c"), {
      positive: ["a", "b", "c"],
      negative: [
        0,
        NaN,
        new String("a"),
        new String("b"),
        new String("c"),
        false,
        {},
        []
      ]
    });
  });

  describe("str", () => {
    describe("is", () => {
      assert(toi.str.is(), {
        positive: ["", "string"],
        negative: [0, false, {}, [], new String("string")]
      });
    });
    describe("nonempty", () => {
      assert(toi.str.nonempty(), {
        positive: ["string"],
        negative: ["", 0, false, {}, [], new String("string")]
      });
    });
    describe("min(1)", () => {
      assert(toi.str.min(1), {
        positive: ["o", "on", "one"],
        negative: [""]
      });
    });
    describe("max(1)", () => {
      assert(toi.str.max(1), {
        positive: ["", "o"],
        negative: ["on"]
      });
    });
    describe("length(1, 2)", () => {
      assert(toi.str.length(1, 2), {
        positive: ["o", "on"],
        negative: ["", "one"]
      });
    });
    describe("regex(/[a-z]/i)", () => {
      assert(toi.str.regex(/^[abc]$/i), {
        positive: ["a", "b", "c"],
        negative: ["", "ab", "bc", "ca", "not", "0"]
      });
    });
    describe("regex(/^[^a]?(a?)[^a]?$/, '$1')", () => {
      transform(toi.str.regex(/^[^a]?(a?)[^a]?$/, "$1"), {
        positive: [
          ["", ""],
          ["a", "a"],
          [" a", "a"],
          ["a ", "a"],
          [" a ", "a"]
        ],
        negative: ["aba"]
      });
    });
  });

  describe("num", () => {
    describe("is", () => {
      assert(toi.num.is(), {
        positive: [0, 1, -1],
        negative: [NaN, "", "-1", "0", "1", false, {}, [], new Number(0)]
      });
    });

    describe("isNaN", () => {
      assert(toi.num.isNaN(), {
        positive: [0, 1, -1, NaN],
        negative: [false, "", "-1", "0", "1", {}, [], new Number(0)]
      });
    });

    describe("min(1)", () => {
      assert(toi.num.min(1), {
        positive: [1, 2],
        negative: [NaN, 0, -1]
      });
    });

    describe("max(1)", () => {
      assert(toi.num.max(1), {
        positive: [-1, 0, 1],
        negative: [NaN, 2]
      });
    });

    describe("parse", () => {
      transform(toi.num.parse(), {
        positive: [
          ["0", 0],
          ["1", 1],
          ["-1", -1],
          ["+1", 1],
          ["not-a-number", NaN]
        ]
      });
    });

    describe("integer", () => {
      transform(toi.num.integer(), {
        positive: [
          [0, 0],
          [1, 1],
          [-1, -1],
          [NaN, NaN],
          [0.1, 0],
          [-0.1, 0],
          [1.1, 1],
          [-1.1, -1]
        ]
      });
    });
  });

  describe("bool", () => {
    describe("is", () => {
      assert(toi.bool.is(), {
        positive: [true, false],
        negative: [NaN, "", 0, {}, [], new Boolean(false)]
      });
    });

    describe("truth", () => {
      assert(toi.bool.truth(), {
        positive: [true],
        negative: [
          false,
          0,
          1,
          -1,
          NaN,
          "",
          "a",
          {},
          [],
          new Boolean(false),
          new Boolean(true)
        ]
      });
    });

    describe("falseness", () => {
      assert(toi.bool.falseness(), {
        positive: [false],
        negative: [
          true,
          0,
          -1,
          1,
          NaN,
          "",
          "a",
          {},
          [],
          new Boolean(true),
          new Boolean(false)
        ]
      });
    });

    describe("truthy", () => {
      transform(toi.bool.truthy(), {
        positive: [
          [1, true],
          [-1, true],
          [true, true],
          [new Boolean(true), true],
          [new Boolean(false), true],
          ["true", true],
          [{}, true],
          [[], true],
          [0, false],
          ["", false],
          [false, false],
          [NaN, false]
        ]
      });
    });

    describe("falsy", () => {
      transform(toi.bool.falsy(), {
        positive: [
          [1, false],
          [-1, false],
          [true, false],
          [new Boolean(true), false],
          [new Boolean(false), false],
          ["true", false],
          [{}, false],
          [[], false],
          [0, true],
          ["", true],
          [false, true],
          [NaN, true]
        ]
      });
    });
  });

  describe("func", () => {
    describe("is", () => {
      assert(toi.func.is(), {
        positive: [<X>(x: X) => x, (a: number, b: number) => a + b],
        negative: [NaN, "", 0, {}, [], new Boolean(false)]
      });
    });
  });

  describe("obj", () => {
    describe("is", () => {
      assert(toi.obj.is(), {
        positive: [
          [],
          {},
          new Date(),
          new String("hello"),
          new Number(1),
          new Boolean(false)
        ],
        negative: [NaN, false, "", 0]
      });
    });

    describe("keys({ a: toi.str.is(), b: toi.num.is() })", () => {
      assert(
        toi.obj.keys({
          a: toi.required().and(toi.str.is()),
          b: toi.required().and(toi.num.is())
        }),
        {
          positive: [
            { a: "", b: 0 },
            { a: "hello", b: 2 },
            { a: "a", b: 0, c: "c" }
          ],
          negative: [
            { a: 0, b: 0 },
            { a: "hello", b: "world" },
            {},
            { a: "hello" },
            { b: 0 }
          ]
        }
      );
    });

    describe("keys() error handling", () => {
      it("should throw a non-validation error immediately", () => {
        class TestError extends Error {}

        try {
          return toi.obj.keys({
            a: toi.wrap<unknown, string>("testerror", () => {
              throw new TestError();
            })
          })({ a: 0 });
        } catch (error) {
          if (error instanceof TestError) {
            return error;
          }
          throw error;
        }
      });

      it("should throw validation error with object reason", () => {
        const input = { a: 0, b: "" };

        try {
          return toi.obj.keys({ a: toi.str.is(), b: toi.str.is() })(input);
        } catch (error) {
          if (!(error instanceof toi.ValidationError)) {
            throw error;
          }

          const reasons = error.reasons;

          if ("object" !== typeof reasons) {
            throw new Error("Reasons is not an object.");
          }

          if (!((reasons as any)["a"] instanceof toi.ValidationError)) {
            throw new Error(
              "Reasons does not include validation error for failed field."
            );
          }

          return error;
        }
      });
    });

    describe("xor(['a', 'b'])", () => {
      assert(toi.obj.xor(["a", "b"]), {
        positive: [{ a: 0, c: 1 }, { b: 0, c: 1 }],
        negative: [{ a: 0, b: 1 }, { a: 0, b: 1, c: 2 }, { c: 0 }, {}]
      });
    });

    describe("and(['a', 'b'])", () => {
      assert(toi.obj.and(["a", "b"]), {
        positive: [{ a: 0, b: 1 }, { a: 0, b: 1, c: 2 }],
        negative: [
          {},
          { a: 0 },
          { b: 0 },
          { c: 1 },
          { a: 0, c: 1 },
          { b: 0, c: 2 }
        ]
      });
    });

    describe("number", () => {
      assert(toi.obj.number(), {
        positive: [new Number(), new Number(1)],
        negative: [0, 1, -1, NaN, {}, [], false, true, "", "-1", "0", "1"]
      });
    });

    describe("string", () => {
      assert(toi.obj.string(), {
        positive: [new String(), new String("string")],
        negative: [0, 1, -1, NaN, {}, [], false, true, "", "string"]
      });
    });

    describe("boolean", () => {
      assert(toi.obj.boolean(), {
        positive: [new Boolean(), new Boolean(false), new Boolean(true)],
        negative: [0, 1, -1, NaN, {}, [], false, true, "", "true", "false"]
      });
    });

    describe("array", () => {
      assert(toi.obj.array(), {
        positive: [[], new Array(), [0]],
        negative: [0, 1, -1, NaN, {}, { length: 1, 0: 1 }, false, true, ""]
      });
    });

    describe("primitive", () => {
      transform(toi.obj.primitive(), {
        positive: [
          [new Boolean(true), true],
          [new Boolean(false), false],
          [new Number(-1), -1],
          [new Number(1), 1],
          [new Number(0), 0],
          [new String(""), ""],
          [new String("a"), "a"],
          [[], []],
          [{}, {}]
        ]
      });
    });

    describe("defaults", () => {
      transform(
        toi.obj.defaults<{ a?: number; b?: string; c?: boolean }>({
          a: 1,
          b: "b",
          c: false
        }),
        {
          positive: [
            [{}, { a: 1, b: "b", c: false }],
            [{ a: 2 }, { a: 2, b: "b", c: false }],
            [{ b: "hello" }, { a: 1, b: "hello", c: false }],
            [{ c: true }, { a: 1, b: "b", c: true }]
          ]
        }
      );
    });
  });

  describe("array", () => {
    describe("is", () => {
      assert(toi.array.is(), {
        positive: [null, undefined, []],
        negative: [NaN, 0, "", {}, { length: 3 }]
      });
    });

    describe("items(toi.str.is())", () => {
      assert(toi.array.items(toi.str.is()), {
        positive: [[], [null], [undefined], [""], ["", ""]],
        negative: [[0], [false], [{}], [[]]]
      });
    });

    describe("items(toi.num.integer())", () => {
      it(`should return a copied transformed array when an element is transformed`, () => {
        const input = [0, 1, 2, 3.1, 4, 5];
        const output = [0, 1, 2, 3, 4, 5];

        const transformed = toi.array.items(toi.num.integer())(input);

        if (transformed === input) {
          throw new Error("Input array was not transformed!");
        }

        if (!equality(output, transformed)) {
          throw new Error("Input array was wrongly transformed!");
        }
      });

      it(`should return the input array when no element is transformed`, () => {
        const input = [0, 1, 2, 3, 4, 5];

        const transformed = toi.array.items(toi.num.integer())(input);

        if (transformed !== input) {
          throw new Error("Input array was transformed!");
        }
      });
    });

    describe("items() error handling", () => {
      it(`should throw a non-validation error immediately`, () => {
        class TestError extends Error {}

        try {
          return toi.array.items(
            toi.wrap("errortest", () => {
              throw new TestError();
            })
          )([0]);
        } catch (error) {
          if (error instanceof TestError) {
            return error;
          }
          throw error;
        }
      });

      it(`should throw validation error with a reason array`, () => {
        const input = [0, 1];

        try {
          return toi.array.items(toi.str.is())(input);
        } catch (error) {
          if (error instanceof toi.ValidationError) {
            const reasons = error.reasons;

            if (!Array.isArray(reasons)) {
              throw new Error("Reasons is not an array!");
            }

            if (reasons.length !== input.length) {
              throw new Error(
                "Reasons are an array but with different length from input."
              );
            }

            reasons.forEach((reason, index) => {
              if (!(reason instanceof toi.ValidationError)) {
                throw new Error(
                  `Reason at index ${index} is not a validation error. ${reason}`
                );
              }
            });

            return error;
          }
          throw error;
        }
      });
    });

    describe("min(1)", () => {
      assert(toi.array.min(1), {
        positive: [[1], [1, 2]],
        negative: [[]]
      });
    });

    describe("max(1)", () => {
      assert(toi.array.max(1), {
        positive: [[], [1]],
        negative: [[1, 2]]
      });
    });

    describe("length(1, 2)", () => {
      assert(toi.array.length(1, 2), {
        positive: [[1], [1, 2]],
        negative: [[], [1, 2, 3]]
      });
    });
  });

  describe("date", () => {
    describe("is", () => {
      assert(toi.date.is(), {
        positive: [new Date(), new Date(0), new Date(-1)],
        negative: [new Date(NaN), 0, NaN, -1, false, true, ""]
      });
    });

    describe("parse", () => {
      transform(toi.date.parse(), {
        positive: [["1970-01-01T00:00:00.000Z", new Date(0)]],
        negative: [""]
      });
    });

    describe("milliseconds", () => {
      transform(toi.date.milliseconds(), {
        positive: [[0, new Date(0)], [1, new Date(1)], [-1, new Date(-1)]],
        negative: [NaN]
      });
    });

    describe("seconds", () => {
      transform(toi.date.seconds(), {
        positive: [
          [0, new Date(0)],
          [1, new Date(1000)],
          [-1, new Date(-1000)]
        ],
        negative: [NaN]
      });
    });
  });
});
