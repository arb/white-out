'use strict';

const Stream = require('stream');
const Traverse = require('traverse');
const Reach = require('reach');

const grab = (obj, key) => {
  if (obj.hasOwnProperty(key)) {
    return obj[key];
  }
};
const replacer = (match, group) => {
  return 'X'.repeat(match.length);
};

class WhiteOut extends Stream.Transform {
  constructor (rules, root, options) {
    super(Object.assign({}, options, { objectMode: true }));

    // Shallow copy the filter rules
    const _rules = Object.assign({}, rules);
    Object.keys(rules).forEach((key) => {
      const value = rules[key];
      if (value !== 'censor' && value !== 'remove') {
        // pre-complie the RegEx
        _rules[key] = new RegExp(value);
      }
    });
    this._rules = _rules;
    this._root = root;
  }
  _transform (data, enc, next) {
    const filterRules = this._rules;
    const source = this._root ? Reach(data, this._root) : data;

    Traverse(source).forEach(function (value) {
      if (this.isRoot) {
        return;
      }

      const filter = grab(filterRules, this.key);

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
