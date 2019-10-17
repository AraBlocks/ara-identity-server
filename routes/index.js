const { ontransfer } = require('./transfer')
const { onbalance } = require('./balance')
const { onresolve } = require('./resolve')
const { oncreate } = require('./create')
const { onredeem } = require('./redeem')

module.exports = {
  ontransfer,
  onbalance,
  onresolve,
  oncreate,
  onredeem
}
