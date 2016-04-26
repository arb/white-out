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
  describe('"remove" option', () => {
    it('removes keys from objects', (done) => {
      const wo = new WhiteOut({ password: 'remove' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal({
          name: 'John Smith',
          age: 55,
          values: [1, 2, 3],
          foo: {
            value: 10
          }
        });
        done();
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

    it('removes keys that are arrays', (done) => {
      const wo = new WhiteOut({ values: 'remove' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal({});
        done();
      });

      wo.write({ values: [1, 2, 3] });
      wo.end();
    });

    it('removes keys from a collection', (done) => {
      const wo = new WhiteOut({ ssn: 'remove', age: 'remove' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal([{ name: 'Moe' }, { name: 'Larry' }, { name: 'Shemp' }]);
        done();
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
    it('censors keys from objects', (done) => {
      const wo = new WhiteOut({ password: 'censor' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal({
          name: 'John Smith',
          age: 55,
          values: [1, 2, 3],
          password: 'XXXXXXX',
          foo: {
            value: 10,
            password: 'XXXXXXX'
          }
        });
        done();
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

    it('censors keys that are arrays', (done) => {
      const wo = new WhiteOut({ values: 'censor' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal({
          values: 'XXXXX' // 5 because [1,2,3] becomes '1,2,3'
        });
        done();
      });

      wo.write({ values: [1, 2, 3] });
      wo.end();
    });

    it('censors keys from a collection', (done) => {
      const wo = new WhiteOut({ ssn: 'censor' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal([{
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
        done();
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
    it('mutates matching keys according to the RegExp', (done) => {
      const wo = new WhiteOut({ password: '^.{3}', ssn: /9/g });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal({
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
        done();
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

    it('mutates matching keys in the collection according to the RegExp', (done) => {
      const wo = new WhiteOut({ password: '^.{3}' });
      const out = writeStream();

      wo.pipe(out);

      wo.on('end', () => {
        const item = out.data[0];
        expect(item).to.deep.equal({
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
        done();
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
});
