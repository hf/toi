# Toi's Dynamo

[![Build Status](https://travis-ci.org/hf/toi.svg?branch=master)](https://travis-ci.org/hf/toi) [![codecov](https://codecov.io/gh/hf/toi/branch/master/graph/badge.svg)](https://codecov.io/gh/hf/toi)

Toi is a validator for JavaScript values written in TypeScript.

This is the extra package, where you can find extra validators and transformers
useful for working with [DynamoDB
values](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeValue.html).

It's heavily inspired by [Joi](https://github.com/hapijs/joi), but actually
uses different features from TypeScript's type system to infer the output type
of a validation schema.

See the documentation on Toi on GitHub: [github.com/hf/toi](https://github.com/hf/toi).

## What's up with Dynamo?

If you've ever seen DynamoDB's values you'll shriek. Amazon tried to do a good
job, and let's face it -- JavaScript is terrible with data types -- but the
system they chose is weird and difficult to work with. Toi's Dynamo helps with
that.

Toi is a validation chain builder, but it can also transform values in the same
steps. Dynamo uses these capabilities to transform (and also validate!)
DynamoDB values.

It turns an object like this:

```typescript
const value = {
  M: {
    Null: { NULL: true }, // this is my favorite monstrosity!
    Number: { N: "0.123" },
    String: { S: "Hello, Toi's Dynamo!" },
    Binary: { B: "SGVsbG8sIFRvaSdzIER5bmFtbyE=" },
    Bool: { BOOL: true },
    NumberSet: { NS: ["123", "456"] },
    StringSet: { SS: [ "a", "b" ] }, // really, they had to use "SS"
    BinarySet: { BS: [ "Yq==", "Yg==" }, // it's b.s. !
    ArrayList: { L: [ /* other values here recursively */ ] },
    // ...
  }
}
```

into:

```typescript
const validator = toi.optional()
  .and(dynamo.map.is())
  .and(toi.obj.keys({
    Null: dynamo.isnull(),   // null if null, null if { NULL: true }
    String: dynamo.str.is(), // -> string
    Number: dynamo.num.is().and(toi.num.parse()),
    // -> number in JavaScript
    Binary: dynamo.bin.is(), // -> Buffer
    Bool: dynamo.bool.is(), // -> boolean
    NumberSet: dynamo.numset.is().and(toi.array.items(toi.num.parse())),
    // -> number[] in JavaScript,
    StringSet: dynamo.strset.is(), // -> string[]
    BinarySet: dynamo.binset.is(), // -> Buffer[]
    ArrayList: dynamo.list.is(), // -> unknown[]
  })
```

Additionally it can do validation on the object if you need to use it for
schema versioning or similar use cases.

## Contributors

- Stojan Dimitrovski

## License

Copyright &copy; 2018 Stojan Dimitrovski et al., some rights reserved.

Licensed under the MIT license. You can get a copy of it in `LICENSE`.
