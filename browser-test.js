const Indexed = require('./index')
const test = require('tape')

test('open', async t => {
  const { err, db } = await new Indexed('bar')
  t.assert(!err, 'should open an instance of the database')

  //
  // pass: put
  //
  {
    const { err } = await db.put('foo', 100)
    t.assert(!err, 'a value was added to the database')
  }

  //
  // pass: get
  //
  {
    const { err, data } = await db.get('foo')
    t.assert(!err, 'no error getting value')
    t.assert(data.value === 100, 'the same value put was retrieved')
    t.assert(data.key === 'foo')
  }

  //
  // pass: delete
  //
  {
    const { err } = await db.del('foo')
    t.assert(!err, 'the key was successfully deleted')
  }

  //
  // pass: batch
  //
  {
    const { err } = await db.batch([
      { type: 'put', key: 'a', value: 1 },
      { type: 'put', key: 'b', value: 2 }
    ])
    t.assert(!err, 'batch with two puts successfully committed')
  }

  {
    const { err, data } = await db.get('a')
    t.assert(!err, 'no error retrieving first key committed with last batch')
    t.assert(data.value === 1, 'the correct value from the first put was retrieved')
  }

  {
    const { err, data } = await db.get('b')
    t.assert(!err, 'no error retrieving second key committed with last batch')
    t.assert(data.value === 2, 'the correct value from the second put was retrieved')
  }

  //
  // pass: read
  //
  {
    const { err, events } = await db.read()
    t.assert(!err, 'an iterator was successfully created')
    t.assert(events, 'an events object was recieved')

    const items = []

    events.ondata = data => {
      t.assert(data.value)
      t.assert(data.key)
      items.push(data)
    }

    events.onerror = err => {
      t.assert(false, '', `an error occurred ${err.message}`)
    }

    events.onend = () => {
      t.assert(items.length === 2, 'the number of objects retrieved is correct')
      window.close()
    }
  }

  // TODO
  // - failing tests
  // - benchmark
})
