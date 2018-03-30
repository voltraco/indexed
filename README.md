# SYNOPSIS
Minimalist IndexedDB with async/await.

# USAGE
```basj
npm install voltraco/indexed
```

```js
const Indexed = require('indexed')

async function main () {
  const { err, db } = await new Indexed('bar')
  assert(!err, 'should open an instance of the database')

  //
  // pass: put
  //
  {
    const { err } = await db.put('foo', 100)
    assert(!err, 'a value was added to the database')
  }

  //
  // pass: get
  //
  {
    const { err, data } = await db.get('foo')
    assert(!err, 'no error getting value')
    assert(data.value === 100, 'the same value put was retrieved')
  }

  //
  // pass: delete
  //
  {
    const { err } = await db.del('foo')
    assert(!err, 'the key was successfully deleted')
  }

  //
  // pass: batch
  //
  {
    const { err } = await db.batch([
      { type: 'put', key: 'a', value: 1 },
      { type: 'put', key: 'b', value: 2 }
    ])
    assert(!err, 'batch with two puts successfully committed')
  }

  {
    const { err, data } = await db.get('a')
    assert(!err, 'no error retrieving first key committed with last batch')
    assert(data.value === 1, 'the correct value from the first put was retrieved')
  }

  {
    const { err, data } = await db.get('b')
    assert(!err, 'no error retrieving second key committed with last batch')
    assert(data.value === 2, 'the correct value from the second put was retrieved')
  }

  //
  // pass: read
  //

  //
  // @param {Number} [opts.limit=Infinity] Limit the number of returned
  // @param {String} [opts.lt] Less than
  // @param {String} [opts.lte] Less than or equal to
  // @param {String} [opts.gt] Greater than
  // @param {String} [opts.gte] Greater than or equal to
  //
  {
    const { err, events } = await db.read({ /* opts */ })
    assert(!err, 'an iterator was successfully created')
    assert(events, 'an events object was recieved')

    const items = []
    events.ondata = data => {
      items.push(data)
    }

    events.onerror = err => {
      assert(false, 'an error occurred')
    }

    events.onend = () => {
      assert(items.length === 2, 'the number of objects retrieved is correct')
    }
  }
}

main()
```

