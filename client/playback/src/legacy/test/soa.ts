import StructOfArrays from '../../soa';
import * as test from 'blue-tape';

class B extends Uint8Array {}

test('no primary', (t: test.Test) => {
  t.throws(() => {
    new StructOfArrays({
      id: new Int16Array(0),
      bird: new Uint32Array(0)
    }, <any>'bees');
  });
  t.end();
});

test('insert and query', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Int32Array([1, 2]),
    x: new Float64Array([1, -5565.332]),
    y: new Float64Array([1, 2])
  }, 'id');
  t.deepEqual(db.lookup(2), {id: 2, x: -5565.332, y: 2});
  t.deepEqual(db.lookup(1), {id: 1, x: 1, y: 1});
  db.assertValid();
  t.end();
});

test('insertBulk and query', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Uint8Array([2, 4, 5, 7, 8, 11, 255]),
    radius: new Float64Array([.5, .6, .5, 1, 2, 1, 8]),
    color: new Uint8Array([0, 0, 1, 0, 0x18, 0x36, 34])
  }, 'id');
  t.deepEqual(db.lookup(2), {id: 2, radius: .5, color: 0});
  t.deepEqual(db.lookup(4), {id: 4, radius: .6, color: 0});
  t.deepEqual(db.lookup(5), {id: 5, radius: .5, color: 1});
  t.deepEqual(db.lookup(7), {id: 7, radius: 1, color: 0});
  t.deepEqual(db.lookup(8), {id: 8, radius: 2, color: 0x18});
  t.deepEqual(db.lookup(11), {id: 11, radius: 1, color: 0x36});
  t.deepEqual(db.lookup(255), {id: 255, radius: 8, color: 34});
  db.assertValid();
  t.end();
});

test('alter', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Uint8Array([4, 2, 5, 7, 8, 11, 255]),
    radius: new Float64Array([.6, .5, .5, 1, 2, 1, 8]),
    color: new Uint8Array([0, 0, 1, 0, 0x18, 0x36, 34])
  }, 'id');
  db.alter({id: 255, radius: 0, color: 1});
  db.alter({id: 7, radius: 300, color: 3});

  t.deepEqual(db.lookup(2), {id: 2, radius: .5, color: 0});
  t.deepEqual(db.lookup(4), {id: 4, radius: .6, color: 0});
  t.deepEqual(db.lookup(5), {id: 5, radius: .5, color: 1});
  t.deepEqual(db.lookup(8), {id: 8, radius: 2, color: 0x18});
  t.deepEqual(db.lookup(7), {id: 7, radius: 300, color: 3});
  t.deepEqual(db.lookup(11), {id: 11, radius: 1, color: 0x36});
  t.deepEqual(db.lookup(255), {id: 255, radius: 0, color: 1});
  db.assertValid();
  t.end();
});

test('delete', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Uint8Array([4, 2, 5, 7, 8, 11, 255]),
    radius: new Float64Array([.6, .5, .5, 1, 2, 1, 8]),
    color: new Uint8Array([0, 0, 1, 0, 0x18, 0x36, 34])
  }, 'id');
  db.delete(8);
  t.throws(() => db.lookup(8));
  t.deepEqual(db.lookup(2), {id: 2, radius: .5, color: 0});
  t.deepEqual(db.lookup(4), {id: 4, radius: .6, color: 0});
  t.deepEqual(db.lookup(5), {id: 5, radius: .5, color: 1});
  t.deepEqual(db.lookup(7), {id: 7, radius: 1, color: 0});
  t.deepEqual(db.lookup(11), {id: 11, radius: 1, color: 0x36});
  t.deepEqual(db.lookup(255), {id: 255, radius: 8, color: 34});
  db.assertValid();
  t.end();
});

test('deleteBulk', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Uint8Array([0, 4, 2, 5, 7, 8, 11, 255]),
    radius: new Float64Array([7, .6, .5, .5, 1, 2, 1, 8]),
    color: new Uint8Array([3, 0, 0, 1, 0, 0x18, 0x36, 34])
  }, 'id');
  // Note: the 18 entry should avoid deleting anything
  db.deleteBulk(new Uint8Array([4, 2, 5, 7, 18]));
  t.throws(() => db.lookup(4));
  t.throws(() => db.lookup(2));
  t.throws(() => db.lookup(5));
  t.throws(() => db.lookup(7));
  t.deepEqual(db.lookup(0), {id: 0, radius: 7, color: 3});
  t.deepEqual(db.lookup(8), {id: 8, radius: 2, color: 0x18});
  t.deepEqual(db.lookup(11), {id: 11, radius: 1, color: 0x36});
  t.deepEqual(db.lookup(255), {id: 255, radius: 8, color: 34});
  db.assertValid();
  t.end();
});

test('copy', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Uint8Array([0, 4, 2, 5, 7, 8, 11, 255]),
    radius: new Float64Array([7, .6, .5, .5, 1, 2, 1, 8]),
    color: new Uint8Array([3, 0, 0, 1, 0, 0x18, 0x36, 34])
  }, 'id');
  const db2 = db.copy();

  t.equal(db.length, db2.length);
  for (const array in db.arrays) {
    t.deepEqual(db.arrays[array].slice(0, db.length), db2.arrays[array].slice(0, db2.length));
  }
  t.deepEqual(db['_primLookup'], db2['_primLookup']);
  t.end();
});

test('double insert', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Uint8Array(0),
  }, 'id');
  t.throws(() => {
    db.insert({id: 0});
    db.insert({id: 0});
  });
  t.end();
});

test('clear', (t: test.Test) => {
  const db = new StructOfArrays({
    id: new Uint8Array([0, 4, 2, 5, 7, 8, 11, 255]),
    radius: new Float64Array([7, .6, .5, .5, 1, 2, 1, 8]),
    color: new Uint8Array([3, 0, 0, 1, 0, 0x18, 0x36, 34])
  }, 'id');

  db.clear();
  t.equal(db.length, 0);
  t.end();
});
