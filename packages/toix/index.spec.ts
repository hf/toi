import "mocha";

import * as toi from "@toi/toi";
import * as toix from "./index";

function equality(a: any, b: any): boolean {
  if (isNaN(a) && isNaN(b)) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.reduce((a, i, index) => a && i == b[index], true);
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
        positive: ["00000000-0000-4000-0000-000000000000", "00000000-0000-0000-0000-000000000000"],
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
        positive: ["google.com", "example.com.mk", "xn--80apaahi7a3c.xn--d1alf"],
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

    describe("url()", () => {
      assert(toix.str.url(), {
        positive: [
          "http://www.google.com",
          "https://www.google.com",
          "http://google.com",
          "http://www.google.com/imghp",
          "http://g.co"
        ],
        negative: ["www.google", "www.google#.com", "www.google-.co", "www.-google.co"]
      });

      assert(toix.str.url({ protocol: "http:" }), {
        positive: ["http://google.com", "http://yahoo.com"],
        negative: ["https://google.com", "https://yahoo.com", "ftp://google.com"]
      });

      assert(toix.str.url({ port: "443" }), {
        positive: ["http://google.com:443", "http://yahoo.com:443"],
        negative: ["http://google.com", "http://yahoo.com"]
      });
    });

    describe("DEPRECATED urlAsString()", () => {
      it("should redirect to isurl()", () => {
        if (toix.str.urlAsString !== toix.str.isurl) {
          throw new Error("toix.str.urlAsString is not toix.str.isurl!");
        }
      });
    });

    describe("isurl()", () => {
      assert(toix.str.isurl(), {
        positive: [
          "http://www.google.com",
          "https://www.google.com",
          "http://google.com",
          "http://www.google.com/imghp",
          "http://g.co",
          "ftp://google.com",
          "http://кирилица.мкд",
          "http://1337.net",
          "http://foo.com/blah_(wikipedia)#cite-1",
          "http://j.mp",
          "http://.",
          "http://0.0.0.0",
          "h://test",
          "ftps://foo.bar/",
          "http:///a"
        ],
        negative: [
          "www.google",
          "www.google#.com",
          "www.google-.co",
          "www.-google.co",
          "http://",
          "http://??",
          "///a",
          ":// should fail",
          "//"
        ]
      });
    });

    describe("startsWith()", () => {
      assert(toix.str.startsWith("test"), {
        positive: ["test-123"],
        negative: ["does-not-start-test-123"]
      });
    });

    describe("endsWith()", () => {
      assert(toix.str.endsWith("test"), {
        positive: ["123-test"],
        negative: ["does-not-end-test-123"]
      });
    });

    describe("contains()", () => {
      assert(toix.str.contains("test"), {
        positive: ["123-test-contains"],
        negative: ["does-not-contain"]
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

    describe("split('.')", () => {
      transform(toix.str.split("."), {
        positive: [["hello.world", ["hello", "world"]]],
        negative: []
      });
    });

    describe("split(/[.]/)", () => {
      transform(toix.str.split(/[.]/), {
        positive: [["hello.world", ["hello", "world"]]],
        negative: []
      });
    });

    describe("replace('.', ':')", () => {
      transform(toix.str.replace(".", ":"), {
        positive: [[".", ":"]],
        negative: []
      });
    });

    describe("replace(/[.]/, ':')", () => {
      transform(toix.str.replace(/[.]/, ":"), {
        positive: [[".", ":"]],
        negative: []
      });
    });

    describe("replace(/[.]/, () => ':')", () => {
      transform(toix.str.replace(/[.]/, () => ":"), {
        positive: [[".", ":"]],
        negative: []
      });
    });

    describe("phoneNumber()", () => {
      assert(toix.str.phoneNumber(), {
        positive: ["+8006927753", "+3891234567", "8006927753"],
        negative: ["+012", "+1", "+", "1", "+1234567891234567"]
      });
    });

    describe("isbase64() RFC4648 not-url", () => {
      toix.str.isbase64(null as any);
      toix.str.isbase64("rfc4648");
      toix.str.isbase64("default");

      try {
        toix.str.isbase64("rfc2045" as any);
        throw new Error("Allowed to specify RFC2045 but not implemented!");
      } catch (error) {}

      assert(toix.str.isbase64(), {
        positive: [
          "",
          "XX==",
          "XXX=",
          "XXXX",
          "11112222",
          "111122==",
          "1111222=",
          "111122223333",
          "1111222233==",
          "11112222333="
        ],
        negative: ["X", "XX", "XXX", "#", "____", "----", "==", "=", "====", "X===", "X==", "X="]
      });
    });

    describe("isbase64('rfc4648-url')", () => {
      toix.str.isbase64("url");
      toix.str.isbase64("rfc4648-url");

      assert(toix.str.isbase64("rfc4648-url"), {
        positive: [
          "",
          "XX",
          "XXX",
          "1111",
          "11112222",
          "1111222",
          "111122",
          "1111222=",
          "111122==",
          "____--=="
        ],
        negative: ["X", "#", "////", "++++", "==", "=", "====", "X===", "X==", "X="]
      });
    });

    describe("isbase32() RFC4648 not-url", () => {
      toix.str.isbase32(null as any);
      toix.str.isbase32("default");
      toix.str.isbase32("rfc4648");

      try {
        toix.str.isbase32("z-base" as any);
        throw new Error("Allowed the use of z-base-32 encoding but it is not implemented.");
      } catch (error) {}

      assert(toix.str.isbase32(), {
        positive: [
          "",
          "XXXXYYYY", // 40 bits
          "XX======", // 8 bits
          "XXXX====", // 16 bits
          "XXXXY===", // 24 bits
          "XXXXYYY=", // 32 bits
          "22227777XXXXYYYY", // 40 + 40 bits
          "22227777XX======", // 40 + 8 bits
          "22227777XXXX====", // 40 + 16 bits
          "22227777XXXXY===", // 40 + 24 bits
          "22227777XXXXYYY=" //  40 + 32 bits
        ],
        negative: [
          "00000000",
          "11111111",
          "88888888",
          "99999999",
          "2222333300000000",
          "2222333311111111",
          "2222333388888888",
          "2222333399999999",
          "========",
          "======",
          "====",
          "===",
          "=",
          "XXXXYYYYX=======",
          "XXXXYYYYXXX=====",
          "XXXXYYYYXXXXXX==",
          "aaaaaaaaaaaaaaa=" //  40 + 32 bits
        ]
      });

      describe("isbase32('rfc4648-url')", () => {
        toix.str.isbase32("url");

        assert(toix.str.isbase32("rfc4648-url"), {
          positive: [
            "",
            "XXXXYYYY", // 40 bits
            "XX======", // 8 bits
            "XXXX====", // 16 bits
            "XXXXY===", // 24 bits
            "XXXXYYY=", // 32 bits
            "22227777XXXXYYYY", // 40 + 40 bits
            "22227777XX======", // 40 + 8 bits
            "22227777XXXX====", // 40 + 16 bits
            "22227777XXXXY===", // 40 + 24 bits
            "22227777XXXXYYY=", //  40 + 32 bits
            "XXXXYYYY", // 40 bits
            "XX", // 8 bits
            "XXXX", // 16 bits
            "XXXXY", // 24 bits
            "XXXXYYY", // 32 bits
            "22227777XXXXYYYY", // 40 + 40 bits
            "22227777XX", // 40 + 8 bits
            "22227777XXXX", // 40 + 16 bits
            "22227777XXXXY", // 40 + 24 bits
            "22227777XXXXYYY" //  40 + 32 bits
          ],
          negative: [
            "00000000",
            "11111111",
            "88888888",
            "99999999",
            "2222333300000000",
            "2222333311111111",
            "2222333388888888",
            "2222333399999999",
            "========",
            "======",
            "====",
            "===",
            "=",
            "XXXXYYYYX=======",
            "XXXXYYYYXXX=====",
            "XXXXYYYYXXXXXX==",
            "aaaaaaaaaaaaaaa=", //  40 + 32 bits
            "XXXXYYYYX",
            "XXXXYYYYXXX",
            "XXXXYYYYXXXXXX",
            "aaaaaaaaaaaaaaa" //  40 + 32 bits
          ]
        });
      });
    });
  });

  describe("bool", () => {
    describe("parse() yes/no", () => {
      transform(toix.bool.parse(), {
        positive: [
          ["y", true],
          ["yes", true],
          ["Yes", true],
          ["YES", true],
          ["n", false],
          ["no", false],
          ["No", false],
          ["NO", false]
        ],
        negative: ["", "yesterday", "nobody"]
      });
    });

    describe("parse() true/false", () => {
      transform(toix.bool.parse(), {
        positive: [
          ["t", true],
          ["true", true],
          ["True", true],
          ["TRUE", true],
          ["f", false],
          ["false", false],
          ["False", false],
          ["FALSE", false]
        ],
        negative: ["", "trueness", "falsehood"]
      });
    });

    describe("parse() on/off", () => {
      transform(toix.bool.parse(), {
        positive: [
          ["on", true],
          ["On", true],
          ["ON", true],
          ["off", false],
          ["Off", false],
          ["OFF", false]
        ],
        negative: ["", "ontology", "offsite"]
      });
    });

    describe("parse() 1/0", () => {
      transform(toix.bool.parse(), {
        positive: [["1", true], ["0", false]],
        negative: ["", "10", "01", "2"]
      });
    });
  });

  describe("json", () => {
    describe("parse()", () => {
      transform(toix.json.parse(), {
        positive: [[JSON.stringify({}), {}]],
        negative: ["", "{", "["]
      });
    });

    describe("stringify()", () => {
      transform(toix.json.stringify(), {
        positive: [[{}, "{}"]]
      });
    });
  });
});
