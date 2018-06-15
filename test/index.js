'use strict';

const Code = require('code');
const Lab = require('lab');
const WhiteOut = require('../index');
const Stream = require('stream');

// Test shortcuts

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

const writeStream = () => {
  const result = new Stream.Writable({ objectMode: true });
  result.data = [];
  result._write = (chunk, enc, callback) => {
    result.data.push(chunk);
    return callback();
  };
  return result;
};

describe('white-out', () => {
  it('throws an error if "root" is not a string', () => {
    expect(() => { return new WhiteOut({}, { root: [] }); }).to.throw('root must be a string');
  });

  it('throws an error if "censorText" is not a string', () => {
    expect(() => { return new WhiteOut({}, { censorText: [] }); }).to.throw('censorText must be a string');
  });

  describe('"remove" option', () => {
    it('removes keys from objects', () => {
      const wo = new WhiteOut({ password: 'remove' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          name: 'John Smith',
          age: 55,
          values: [1, 2, 3],
          foo: {
            value: 10
          }
        });
      });

      wo.write({
        name: 'John Smith',
        age: 55,
        values: [1, 2, 3],
        password: 'hunter1',
        foo: {
          password: 'hunter1',
          value: 10
        }
      });
      wo.end();
    });

    it('removes keys that are arrays', () => {
      const wo = new WhiteOut({ values: 'remove' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({});
      });

      wo.write({ values: [1, 2, 3] });
      wo.end();
    });

    it('removes keys from a collection', () => {
      const wo = new WhiteOut({ ssn: 'remove', age: 'remove' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal([{ name: 'Moe' }, { name: 'Larry' }, { name: 'Shemp' }]);
      });

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
      wo.end();
    });
  });

  describe('"censor" option', () => {
    it('censors keys from objects', () => {
      const wo = new WhiteOut({ password: 'censor' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          name: 'John Smith',
          age: 55,
          values: [1, 2, 3],
          password: 'XXXXXXX',
          foo: {
            value: 10,
            password: 'XXXXXXX'
          }
        });
      });

      wo.write({
        name: 'John Smith',
        age: 55,
        values: [1, 2, 3],
        password: 'hunter1',
        foo: {
          password: 'hunter1',
          value: 10
        }
      });
      wo.end();
    });

    it('censors keys that are arrays', () => {
      const wo = new WhiteOut({ values: 'censor' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          values: 'XXXXX' // 5 because [1,2,3] becomes '1,2,3'
        });
      });

      wo.write({ values: [1, 2, 3] });
      wo.end();
    });

    it('censors keys from a collection', () => {
      const wo = new WhiteOut({ ssn: 'censor' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal([{
          name: 'Moe',
          age: 44,
          ssn: 'XXX'
        }, {
          name: 'Larry',
          age: 41,
          ssn: 'XXXXX'
        }, {
          name: 'Shemp',
          age: 38,
          ssn: 'XXXX'
        }]);
      });

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
      wo.end();
    });
  });

  describe('RegExp option', () => {
    it('mutates matching keys according to the RegExp', () => {
      const wo = new WhiteOut({ password: '^.{3}', ssn: /9/g });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          name: 'John Smith',
          age: 55,
          values: [1, 2, 3],
          password: 'XXXter1',
          ssn: '1111112231',
          foo: {
            value: 10,
            password: 'XXXter1',
            ssn: 'XX23X8110X80'
          }
        });
      });

      wo.write({
        name: 'John Smith',
        age: 55,
        values: [1, 2, 3],
        password: 'hunter1',
        ssn: 1111112231,
        foo: {
          password: 'hunter1',
          value: 10,
          ssn: 992398110980
        }
      });
      wo.end();
    });

    it('mutates matching keys in the collection according to the RegExp', () => {
      const wo = new WhiteOut({ password: '^.{3}' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
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
        });
      });

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
      wo.end();
    });
  });

  describe('root option', () => {
    it('traverses starting at the root when specified', () => {
      const wo = new WhiteOut({ password: 'remove', name: 'censor' }, { root: 'foo' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          name: 'John Smith',
          values: [1, 2, 3],
          password: 'hunter1',
          foo: {
            name: 'XXXXXXXXXX'
          }
        });
      });

      wo.write({
        name: 'John Smith',
        values: [1, 2, 3],
        password: 'hunter1',
        foo: {
          password: 'hunter1',
          name: 'John Smith'
        }
      });
      wo.end();
    });

    it('safely handles unknown root values', () => {
      const wo = new WhiteOut({ password: 'remove' }, { root: 'bar' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          name: 'John Smith'
        });
      });

      wo.write({
        name: 'John Smith'
      });
      wo.end();
    });

    it('safely handles root being a non-object', () => {
      const wo = new WhiteOut({ password: 'remove' }, { root: 'name' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          name: 'John Smith'
        });
      });

      wo.write({
        name: 'John Smith'
      });
      wo.end();
    });
  });

  describe('censorText option', () => {
    it('censors keys by provided censorText', () => {
      const wo = new WhiteOut({ password: 'censor' }, { censorText: '******redacted******' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.equal({
          name: 'John Smith',
          age: 55,
          values: [1, 2, 3],
          password: '******redacted******',
          foo: {
            value: 10,
            password: '******redacted******'
          }
        });
      });

      wo.write({
        name: 'John Smith',
        age: 55,
        values: [1, 2, 3],
        password: 'hunter1',
        foo: {
          password: 'hunter1',
          value: 10
        }
      });
      wo.end();
    });
  });
});
