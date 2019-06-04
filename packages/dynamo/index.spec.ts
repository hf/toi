import "mocha";

import * as toi from "@toi/toi";
import * as dynamo from "./index";

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
    } else if (value instanceof Buffer) {
      return `Buffer(${value.length})`;
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
      a.reduce((a, i, index) => a && equality(i, b[index]), true)
    );
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (a instanceof Buffer && b instanceof Buffer) {
    return 0 === a.compare(b);
  }

  return a === b;
}

function transform<I, O>(
  validator: toi.Validator<I, O>,
  options: {
    positive?: [unknown, unknown][];
    negative?: unknown[];
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

  it(`should transform { NULL: true } into null`, () => {
    if (null !== validator({ NULL: true } as any)) {
      throw new Error("Did not transform!");
    }
  });

  (options.positive || []).forEach(pair => {
    const input = pair[0];
    const output = pair[1];

    it(`should transform ${inspect(input)} into ${inspect(output)}`, () => {
      const transformed = validator(input as I);

      if (!equality(output, transformed)) {
        throw new Error("Did not transform!");
      }
    });
  });

  (options.negative || []).forEach(value => {
    it(`should not transform ${inspect(value)}`, () => {
      try {
        validator(value as I);
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

describe("dynamo", () => {
  describe("nullable()", () => {
    transform(dynamo.nullable(), {
      positive: [[{}, {}], [1, 1], ["", ""], [{ NULL: false }, { NULL: false }]]
    });
  });

  describe("isnull()", () => {
    transform(dynamo.isnull(), {
      positive: [[{ NULL: true }, null]],
      negative: [
        {},
        false,
        { NULL: false },
        { N: "1" },
        { NULL: 1 },
        { S: "1" },
        { B: "1" },
        { SS: ["1"] },
        { BS: ["1"] },
        { NS: ["1"] },
        { M: {} },
        { L: [] }
      ]
    });
  });

  describe("str", () => {
    describe("is()", () => {
      transform(dynamo.str.is(), {
        positive: [[{ NULL: true }, null], [{ S: "" }, ""], [{ S: "a" }, "a"]],
        negative: [
          { N: "1" },
          { B: "x" },
          { BOOL: false },
          { SS: ["x"] },
          { NS: ["1"] },
          { BS: ["x"] },
          { L: [] },
          { M: {} },
          { S: new String() },
          { S: null },
          { S: 1 },
          { S: [] }
        ]
      });
    });
  });

  describe("strset", () => {
    describe("is()", () => {
      transform(dynamo.strset.is(), {
        positive: [[{ SS: ["a"] }, ["a"]], [{ SS: ["a", "b"] }, ["a", "b"]]],
        negative: [
          { S: "x" },
          { N: "1" },
          { B: "x" },
          { BOOL: false },
          { NS: ["1"] },
          { BS: ["x"] },
          { L: [] },
          { M: {} },
          { SS: null },
          { SS: 1 },
          { SS: [] },
          { SS: [1] },
          { SS: [new String()] }
        ]
      });
    });
  });

  describe("num", () => {
    describe("is()", () => {
      transform(dynamo.num.is(), {
        positive: [
          [{ N: "123" }, "123"],
          [{ N: "0.0" }, "0.0"],
          [{ N: "0" }, "0"],
          [{ N: "-1" }, "-1"],
          [{ N: "1" }, "1"],
          [{ N: "1.1" }, "1.1"],
          [
            {
              N:
                "1.1111111111111111111111111111111111111111111111111111111111111111"
            },
            "1.1111111111111111111111111111111111111111111111111111111111111111"
          ],
          [{ N: "0.1" }, "0.1"],
          [{ N: "-0.1" }, "-0.1"],
          [{ N: "-0.01" }, "-0.01"],
          [{ N: "1000" }, "1000"]
        ],
        negative: [
          { N: "-0" },
          { N: "-01" },
          { N: "-01.1" },
          { N: "+1" },
          { N: "1.1.1" },
          { N: "1.0" },
          { N: "-1.1110" },
          { N: "" },
          { N: "non-digits" },
          { N: null },
          { N: 1 },
          { N: [] },
          { S: "x" },
          { B: "x" },
          { BOOL: false },
          { NS: ["1"] },
          { BS: ["x"] },
          { SS: ["x"] },
          { L: [] },
          { M: {} }
        ]
      });
    });

    describe("parse()", () => {
      transform(dynamo.num.is().and(dynamo.num.parse()), {
        positive: [[{ N: "-1.123" }, -1.123]],
        negative: []
      });
    });
  });

  describe("numset", () => {
    describe("is()", () => {
      transform(dynamo.numset.is(), {
        positive: [[{ NS: ["1"] }, ["1"]], [{ NS: ["1", "2"] }, ["1", "2"]]],
        negative: [
          { NS: [] },
          { NS: ["non-digit"] },
          { NS: null },
          { NS: {} },
          { N: 1 },
          { S: "x" },
          { B: "x" },
          { BOOL: false },
          { BS: ["x"] },
          { SS: ["x"] },
          { L: [] },
          { M: {} }
        ]
      });
    });
  });

  describe("bin", () => {
    describe("is()", () => {
      transform(dynamo.bin.is(), {
        positive: [
          [{ B: "" }, Buffer.alloc(0)],
          [{ B: "abcd" }, Buffer.from("abcd", "base64")]
        ],
        negative: [
          { N: "1" },
          { S: "x" },
          { BOOL: false },
          { SS: ["x"] },
          { NS: ["1"] },
          { BS: ["x"] },
          { L: [] },
          { M: {} },
          { B: new String() },
          { B: null },
          { B: 1 },
          { B: [] },
          { B: Buffer.alloc(10) }
        ]
      });
    });
  });

  describe("binset", () => {
    describe("is()", () => {
      transform(dynamo.binset.is(), {
        positive: [
          [{ BS: [""] }, [Buffer.alloc(0)]],
          [
            { BS: [Buffer.from("Hello, world!", "utf8").toString("base64")] },
            [Buffer.from("Hello, world!", "utf8")]
          ]
        ],
        negative: [
          { S: "x" },
          { N: "1" },
          { B: "x" },
          { BOOL: false },
          { NS: ["1"] },
          { SS: ["x"] },
          { L: [] },
          { M: {} },
          { BS: 1 },
          { BS: [] },
          { BS: [1] },
          { BS: [new String()] },
          { BS: [Buffer.alloc(0)] }
        ]
      });
    });
  });

  describe("bool", () => {
    describe("is()", () => {
      transform(dynamo.bool.is(), {
        positive: [[{ BOOL: true }, true], [{ BOOL: false }, false]],
        negative: [
          { BOOL: null },
          { BOOL: "" },
          { BOOL: NaN },
          { BOOL: 0 },
          { BOOL: "false" },
          { N: 1 },
          { S: "x" },
          { B: "x" },
          { NS: ["1"] },
          { BS: ["x"] },
          { SS: ["x"] },
          { L: [] },
          { M: {} }
        ]
      });
    });
  });

  describe("list", () => {
    describe("is()", () => {
      transform(dynamo.list.is(), {
        positive: [
          [{ L: [] }, []],
          [{ L: [{ S: "" }] }, [{ S: "" }]],
          [{ L: [null, 0, "", false, {}] }, [null, 0, "", false, {}]]
        ],
        negative: [
          { L: null },
          { L: {} },
          { L: "" },
          { N: 1 },
          { S: "x" },
          { B: "x" },
          { BOOL: false },
          { NS: ["1"] },
          { BS: ["x"] },
          { SS: ["x"] },
          { M: {} }
        ]
      });
    });
  });

  describe("map", () => {
    describe("is()", () => {
      const symbolX = Symbol("x");

      transform(dynamo.map.is(), {
        positive: [
          [{ M: {} }, {}],
          [{ M: { hello: { S: "hello" } } }, { hello: { S: "hello" } }],
          [{ M: [] }, []], // arrays are technically empty objects
          [{ M: [1] }, [1]],
          [{ M: { [symbolX]: { S: "hello" } } }, { [symbolX]: { S: "hello" } }]
        ],
        negative: [
          { M: { "": { S: "hello" } } },
          { M: null },
          { N: 1 },
          { S: "x" },
          { B: "x" },
          { BOOL: false },
          { NS: ["1"] },
          { BS: ["x"] },
          { SS: ["x"] }
        ]
      });
    });
  });
});
