# Toi

[![Build Status](https://travis-ci.org/hf/toi.svg?branch=master)](https://travis-ci.org/hf/toi) [![codecov](https://codecov.io/gh/hf/toi/branch/master/graph/badge.svg)](https://codecov.io/gh/hf/toi)

Toi is a validator for JavaScript values written in TypeScript.

It's heavily inspired by [Joi](https://github.com/hapijs/joi), but actually
uses different features from TypeScript's type system to infer the output type
of a validation schema.

## How to use?

It comes in two related packages:

- `@toi/toi` which contains the most basic validators. You can see the source in
  `packages/toi`.
- `@toi/toix` which contains extra and commonly used validators. You can see the
  source in `packages/toix`.

Unlike Joi, it takes a more flexible and monadic approach to building
validation schemas.

### Install

It's packaged under the organization scope `@toi`. Just do:

```
# for toi
yarn add @toi/toi
npm i --save @toi/toi

# for toix
yarn add @toi/toix
npm i --save @toi/toix
```

The major versions of these two packages will always be in sync. It's
recommended you use the caret semver. Currently that is: `@^1.0.0`.

### What's a validation schema?

A validation schema is just a function that has type information about what
it's inputs must be and what the output must be. You invoke this function over
the defined input, and you'll be sure to receive the defined output. Toi makes
it easy to combine validation schemas to build rich output types.

A validator, i.e. a validation schema, has the type `toi.Validator<Input, Output>`. You can make your own validators easily by using the heper function
`toi.wrap`.

Validators can be combined with the `and` function. In full honesty, it acts
like the logical conjucation operator, but it's really more of a `bind` or
`map` operator seen in monads. Effecitvely, it composes the validator function
on which it's called and the provided validation function.

Each validator must obey these rules:

- Must always accept `null` and `undefined` as values, unless really special.
- Must always throw a `ValidationError` if the value is not expected.
- Must throw any non-validation errors as early as possible.
- Must return the correct value passed to them. This value may be transformed.

### How it works?

Let's take a look at some common patterns and how they work with Toi.

Here's a validation schema for all objects of the form `{ num: number; str: string }`.

```typescript
import * as toi from "@toi/toi";

const isObject = toi
  .required() // make toi reject null or undefined
  .and(toi.obj.isplain()) // forces that the value is a plain JS object
  .and(
    toi.obj.keys({
      num: toi.required().and(toi.num.is()),
      str: toi.required().and(toi.str.is())
    })
  ); // makes sure that the object has props num, str that are never null

isObject({ num: 1, str: "1" }); // will pass
isObject(null); // will throw toi.ValidationError
```

You can use `toi.required()` or `toi.optional()` to enforce strict non-null
rules. In TypeScript 2.8 there are conditional types, and these methods use
them to infer whether the starting value is nullable, therefore propagate that
type information down the chain.

It is sometimes possible to skip using these, if you already know what type
you'll be validating. It's also possible to just not use them at all, in which
case nullable type information will not be propagated down the chain. It
doesn't mean tho, that the value is non-null!

### All the validators!

Toi and ToiX are laid out in a specific way, to help you identify validators
easily:

`toi` is the toplevel module. It contains the following submodules:

- `num` includes validators that work with numbers
- `str` includes validators that work with strings
- `bool` includes validators that work with booleans
- `obj` includes validators that work with objects
- `array` includes validators that work with arrays
- `date` includes validators that work with dates
- `any` includes validators for any value
- `optional` special validator for starting a nullable chain
- `required` special validator for starting a non-nullable chain

Each submodule contains a method named `is` that does the most basic type
check. For example: `toi.num.is()` validates that the value provided is a
number, `toi.str.is()` validates that the value provided is a string, etc.

Inside each submodule you'll find different validators for different types of
validations.

One of the goals for Toi is to have really readable code, and you should really
take a look at it in order to find the validators you want. In fact, the
website is just Toi!

### Validation Errors

You can inspect each `toi.ValidationError` via the `reasons` property. If set,
it will mimic the shape of the value that failed validation. So, if an object
fails validation due to some of its properties failing validation, the
`reasons` property will be an object with properties that map to other
`toi.ValidationError`s which caused the validation failure. Similarly it works
for arrays.

### Writing your own validators?

It's real easy. First, make sure you obey the rules for each validator.
Otherwise, there are three methods that will make your life easier:

1.  `toi.wrap("name-in-stack-trace", value => value)` to convert a simple
    validation function into a full-blown `toi.Validator`.
2.  `toi.allow(value => !value, "value is truthy")` to create a simple
    validation function that obeys the rules, from a function that returns
    `true` if the validation passes, or `false` if it does not. You still have
    to use `toi.wrap` on top of this.
3.  `toi.transform(value => value + 1)` to create a simple validation function
    that transforms a value into a different value, and obeys the rules. You
    still have to use `toi.wrap` on top of this.

## Contributing

Only the basic validators out of which you can build more complex validators
should be placed in the `toi` package. Everything else should go into `toix`.

Test coverage must be 100% for both packages. If you don't like it, please make
your own library. Toi was designed to be easy to interoperate with custom
validators (unlike Joi).

Tests must test what the documentation says. Don't test JavaScript runtime
methods, but do explicitly say that they're used.

## License

Copyright &copy; 2018 Stojan Dimitrovski, some rights reserved.

Licensed under the MIT license. You can get a copy of it in `LICENSE`.
