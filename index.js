'use strict';

const Assert = require('assert');
const Reach = require('reach');
const Stream = require('stream');
const Traverse = require('traverse');

const replacer = (match, group) => {
  return 'X'.repeat(match.length);
};

class WhiteOut extends Stream.Transform {
  constructor (rules, options) {
    options = options || {};
    Assert.ok(options.root === undefined || typeof options.root === 'string', 'root must be a string');

    super(Object.assign({}, options.stream, { objectMode: true }));
    this._rules = new Map();
    this._immutable = options.immutable || false;

    Object.keys(rules).forEach((key) => {
      const value = rules[key];
      if (value !== 'censor' && value !== 'remove') {
        // pre-complie the RegEx
        this._rules.set(key, new RegExp(value));
      } else {
        this._rules.set(key, value);
      }
    });

    this._root = options.root;
  }
  _transform (sourceData, enc, next) {
    const rules = this._rules;
    const data = this._immutable ? Traverse(sourceData).clone() : sourceData;
    const source = this._root ? Reach(data, this._root) : data;

    Traverse(source).forEach(function (value) {
      if (this.isRoot) {
        return;
      }

      const filter = rules.get(this.key);

      if (filter) {
        if (filter === 'censor') {
          this.update(('' + value).replace(/./g, 'X'));
        } else if (filter === 'remove') {
          this.delete();
        } else {
          this.update(('' + value).replace(filter, replacer));
        }
      }
    });
    return next(null, data);
  }
}

module.exports = WhiteOut;
