const { Tuple, Record } = require("./src/record-tuple")

const tuple = Tuple(0, 1, 2, 3)
const record = Record({ foo: "bar" })
console.log(tuple, record)
//=> #[ 0, 1, 2, 3 ] in Node.js v18.12.1