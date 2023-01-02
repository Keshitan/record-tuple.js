const { Tuple, Record } = require("./src/record-tuple")

const tuple = Tuple(0, 1, 2, 3)
console.log(tuple)
//=> #[ 0, 1, 2, 3 ] in Node.js v18.12.1