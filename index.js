const Store = (db, loc) => {
  const tx = db.transaction(loc, 'readwrite')
  return { tx, store: tx.objectStore(loc) }
}

const getRange = (o) => {
  const exLower = typeof o.lt !== 'undefined'
  const exUpper = typeof o.gt !== 'undefined'

  const range = window.IDBKeyRange

  if ((o.lte || o.lt) && (o.gte && o.gt)) {
    const args = [
      o.lte || o.lt,
      o.gte || o.gt,
      exLower,
      exUpper
    ]

    return range.bound(...args)
  }

  if (o.lte || o.lt) {
    return range.lowerBound(o.lte || o.lt, exLower)
  }

  if (o.gte || o.gt) {
    return range.upperBound(o.gte || o.gt, exUpper)
  }
}

module.exports = class Indexed {
  constructor (loc) {
    this._loc = loc
    this._db = null
  }

  then (resolve) {
    const r = window.indexedDB.open(this._loc)
    const loc = this._loc

    r.onerror = event => {
      resolve({ err: event.target })
    }

    r.onupgradeneeded = (event) => {
      this._db = event.target.result
      const opts = { keyPath: 'key' }
      const store = this._db.createObjectStore(loc, opts)

      store.transaction.oncomplete = event => {
        resolve({ db: this })
      }
    }

    r.onsuccess = (event) => {
      this._db = event.target.result
      resolve({ db: this })
    }
  }

  get (key) {
    return new Promise(resolve => {
      const { store } = Store(this._db, this._loc)
      const r = store.get(key)
      r.onerror = event => resolve({ err: event.target })
      r.onsuccess = function (event) {
        resolve({ data: this.result })
      }
    })
  }

  put (key, value) {
    return new Promise(resolve => {
      const { store } = Store(this._db, this._loc)
      const r = store.put({ key, value })
      r.onerror = event => resolve({ err: event.target })
      r.onsuccess = event => resolve({})
    })
  }

  del (key) {
    return new Promise(resolve => {
      const { store } = Store(this._db, this._loc)
      const r = store.delete(key)
      r.onerror = event => resolve({ err: event.target })
      r.onsuccess = event => resolve({})
    })
  }

  batch (ops) {
    return new Promise(resolve => {
      const { tx, store } = Store(this._db, this._loc)
      tx.onerror = event => resolve({ err: event.target })
      tx.oncomplete = event => resolve({})

      const eachOp = op => {
        if (op.type === 'put') {
          store.put({ key: op.key, value: op.value })
        }

        if (op.type === 'del') {
          store.delete(op.key)
        }
      }

      ops.forEach(eachOp)
    })
  }

  read (opts = {}) {
    return new Promise(resolve => {
      const { store } = Store(this._db, this._loc)
      const r = store.openCursor(getRange(opts))
      const events = {}
      let count = 0
      resolve({ events })

      function onError (event) {
        if (events.onerror) events.onerror(event.target)
      }

      async function onSuccess (event) {
        const cursor = event.target.result

        if (cursor) {
          const r = store.get(this.result.key)

          r.onerror = event => {
            if (events.onerror) events.onerror(event.target)
          }

          r.onsuccess = function (event) {
            if (events.ondata) events.ondata(this.result)

            if (opts.limit && (count++ === (opts.limit - 1))) {
              if (events.onend) return events.onend()
              return
            }
            cursor.continue()
          }
        } else {
          if (events.onend) events.onend()
        }
      }

      r.onerror = onError
      r.onsuccess = onSuccess
    })
  }
}
