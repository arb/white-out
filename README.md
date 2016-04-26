# white-out

[![Current Version](https://img.shields.io/npm/v/white-out.svg)](https://www.npmjs.org/package/white-out)
[![Travis CI](https://travis-ci.org/continuationlabs/white-out.svg?branch=master)](https://travis-ci.org/continuationlabs/white-out)

[![belly-button-style](https://cdn.rawgit.com/continuationlabs/belly-button/master/badge.svg)](https://github.com/continuationlabs/belly-button)

A transform stream used to censor data from objects before passing them down the pipeline.

## `new WhiteOut (filter, [options])`

Creates a new `WhiteOut` transform stream with the following arguments.
- `filter` - a key value pair where `key` is the property value to censor on the object payload and the `value` is the censor type.
  - Valid options for `value` are "censor", "remove" and a RegExp.
    - "censor" - replaces the value with a string of "X"s.
    - "remove" - completely removes the key from object
    - Anything else will be treated as a `RegExp` definition and will be passed into `new RegExp`.
- `[options]` - additional options to pass into the transform stream constructor. `objectMode` is always `true`.

## Examples

```js
const wo = new WhiteOut({ password: 'remove' });
wo.write({
  name: 'John Smith',
  age: 55,
  values: [1,2,3],
  password: 'hunter1',
  foo: {
    password: 'hunter1',
    value: 10
  }
});
/* results in
{
  name: 'John Smith',
  age: 55,
  values: [1,2,3],
  foo: {
    value: 10
  }
}
*/
```

```js
const wo = new WhiteOut({ ssn: 'remove', age: 'censor' });
const out = writeStream();

wo.write([{
  name: 'Moe',
  age: 44,
  ssn: 123
}, {
  name: 'Larry',
  age: 41,
  ssn: 34343
}, {
  name: 'Shemp',
  age: 38,
  ssn: 9923
}]);
/* results in
[{ name: 'Moe', age: 'XX' }, { name: 'Larry', age: 'XX' }, { name: 'Shemp', age: 'XX' }]
*/
```

```js
const wo = new WhiteOut({ password: '^.{3}' });
wo.write({
  values: [{
    name: 'Moe',
    password: 'password1'
  }, {
    name: 'Larry',
    password: 'password2'
  }, {
    name: 'Shemp',
    password: 'password3'
  }]
});
/*
results in
{
  values: [{
    name: 'Moe',
    password: 'XXXsword1'
  }, {
    name: 'Larry',
    password: 'XXXsword2'
  }, {
    name: 'Shemp',
    password: 'XXXsword3'
  }]
}
*/
```
