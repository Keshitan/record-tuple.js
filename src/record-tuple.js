/**
 * record-tuple
 * 
 * Copyright (c) 2023 Keshitan
 * 
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */


/* Node.js側で解釈可能なシンボル */
const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom')


function convertArray(arrayLike) {
  const length = arrayLike.length ?? 0
  let results = []
  for (let i = 0; i < length; i++) {
    if (i in arrayLike) {
      results[i] = arrayLike[i]
    } else {
      results.length += 1
    }
  }
  return results
}

function ensureArray(array) {
  if (array.some(v => ((v instanceof Object) && !(v instanceof Tuple)) && !(v instanceof Record))) {
    throw Error("Tuple elements are incorrect.")
  }
}


var Tuple = (() => {
  const handler = {}
  handler.get = (target, prop) => {
    if (typeof prop === "symbol" || prop in target) {
      return target[prop]
    } else if (/^-?\d+$/.test(prop)) {
      let n = Number(prop)
      let length = target.length
      if (0 <= n && n < length) {
        return PRIVATE_FIELD.get(target).items.at(n)
      } else if (-length <= n && n < 0) {
        return PRIVATE_FIELD.get(target).items.at(n)
      } else {
        return undefined
      }
    }
  }
  handler.has = (target, prop) => {
    if (typeof prop === "symbol") {
      return prop in target
    } else if (/^-?\d+$/.test(prop)) {
      let n = Number(prop)
      let length = target.length
      if (0 <= n && n < length) {
        return true
      } else if (-length <= n && n < 0) {
        return true
      } else {
        return false
      }
    } else {
      return prop in target
    }
  }
  handler.set = () => { throw Error("Tuple is readonly Object.") }
  handler.defineProperty = () => { throw Error("Tuple is readonly Object.") }


  const PRIVATE_FIELD = new WeakMap()

  function Tuple(...items) {
    if (new.target) {
      ensureArray(items)

      let mediator = { items }
      let rslt = new Proxy(this, handler)

      PRIVATE_FIELD.set(this, mediator)
      PRIVATE_FIELD.set(rslt, mediator)

      return rslt
    } else {
      return new Tuple(...items)
    }
  }

  Tuple.from = (arrayLike) => {
    let tuple = new Tuple()
    let items = convertArray(arrayLike)
    ensureArray(items)

    PRIVATE_FIELD.get(tuple).items = items
    return tuple
  }

  Tuple.of = (...items) => new Tuple(...items)
  Tuple.isTuple = (arg) => arg instanceof Tuple
  Tuple.toString = () => 'function Tuple() { [JavaScript code] }'

  Tuple[customInspectSymbol] = (_, options) => {
    return options.stylize("[Function: Tuple]", "special")
  }


  Tuple.prototype = {
    get length() {
      return PRIVATE_FIELD.get(this).items.length
    },
    [Symbol.iterator]: function* () {
      yield* PRIVATE_FIELD.get(this).items
    },
    [Symbol.isConcatSpreadable]: true,
    [Symbol.toStringTag]: () => "Tuple",
    [customInspectSymbol]: function (_, __, inspect) {
      return inspect(PRIVATE_FIELD.get(this).items, { colors: true }).replace("[", "#[")
    },
    toString: function () {
      return PRIVATE_FIELD.get(this).items.toString()
    },
    toArray: function () {
      const length = this.length ?? 0
      let results = []
      let value
      for (let i = 0; i < length; i++) {
        if (i in this) {
          value = this[i]
          if (value instanceof Tuple) {
            results[i] = value.toArray()
          } else if (value instanceof Record) {
            results[i] = value.toDict()
          } else {
            results[i] = value
          }
        } else {
          results.length += 1
        }
      }
      return results
    },
    toJSON: function () {
      return PRIVATE_FIELD.get(this).items
    }
  }

  return Tuple
})()


function ensureDict(dict) {
  let value
  for (let key in dict) {
    value = dict[key]
    if (typeof key === "symbol") throw Error("Record elements are incorrect.")
    if (((value instanceof Object) && !(value instanceof Tuple)) && !(value instanceof Record)) {
      ensureDict(value)
    }
  }
  return true
}

function convertDict(dict) {
  let obj = {}
  let value
  for (let key in dict) {
    value = dict[key]
    if (value instanceof Tuple) {
      obj[key] = value
    } else if (value instanceof Record) {
      obj[key] = value
    } else if (value instanceof Object) {
      obj[key] = convertDict(value)
    } else {
      obj[key] = value
    }
  }
  return obj
}





var Record = (() => {
  const handler = {
    has: (target, prop) => prop in target,
    get: (target, prop) => {
      if (prop in target) {
        return target[prop]
      } else {
        return PRIVATE_FIELD.get(target).dict[prop]
      }
    },
    ownKeys: (target) => Object.keys(PRIVATE_FIELD.get(target).dict),
    set: () => { throw Error("Record is readonly Object.") }
  }

  const PRIVATE_FIELD = new WeakMap();

  function Record(dict) {
    if (new.target) {
      dict = dict ?? {}

      ensureDict(dict)
      dict = convertDict(dict)

      let mediator = { dict }
      let rslt = new Proxy(this, handler)

      PRIVATE_FIELD.set(this, mediator)
      PRIVATE_FIELD.set(rslt, mediator)

      return rslt
    } else {
      return new Record(dict)
    }
  }

  Record.isRecord = (instance) => instance instanceof Record
  Record.toString = () => 'function Record() { [JavaScript code] }'

  Record[customInspectSymbol] = function (_, options) {
    return options.stylize("[Function: Record]", "special")
  }


  Record.prototype = {
    get size() {
      return Object.keys(PRIVATE_FIELD.get(this).dict).length
    },
    [customInspectSymbol]: function (_, __, inspect) {
      return inspect(PRIVATE_FIELD.get(this).dict, { colors: true }).replace("{", "#{")
    },

    toDict: function () {
      let dict = PRIVATE_FIELD.get(this).dict
      let obj = {}
      let value
      for (let key in dict) {
        value = dict[key]
        if (value instanceof Tuple) {
          obj[key] = value.toArray()
        } else if (value instanceof Record) {
          obj[key] = value.toDict()
        } else {
          obj[key] = value
        }
      }
      return obj
    },
    toJSON: function () {
      return this.toDict()
    },
    toString: () => '[object Record]',
  }

  return Record
})()

module.exports.Tuple = Tuple
module.exports.Record = Record





var Class = (() => {
  const handler = {}
  const PRIVATE_FIELD = new WeakMap();

  function Class(...args) {
    if (new.target) {
      let mediator = { args }
      let rslt = new Proxy(this, handler)

      PRIVATE_FIELD.set(this, mediator)
      PRIVATE_FIELD.set(rslt, mediator)

      return rslt
    } else {
      return new Class(...args)
    }
  }

  Class.isClass = (arg) => arg instanceof Class

  Class.prototype = {
    get args() { return PRIVATE_FIELD.get(this).args },
  }

  return Class
})