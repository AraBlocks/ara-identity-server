const { getGasPrice } = require('./getGasPrice')
const { privateAPI } = require('../config')
const { info, warn } = require('ara-console')
const redisClient = require('../services/redis.js')
const request = require('superagent')
const { token } = require('ara-contracts')
const debug = require('debug')('ara:network:node:identity-manager:getGasPrice')

const {
  basePath,
  apiKey,
  appToken
} = privateAPI
/**
 * Submit a transaction to the blockchain
 * @param  {Object}   opts
 * @param  {String}   opts.to
 * @param  {String}   opts.val
 * @param  {String}   opts.gasPrice
 */

async function submitTransaction(opts) {
  if (!opts.to || 'string' !== typeof opts.to) {
    throw new TypeError(`Expected 'opts.to' to be non-empty Ara DID or Ethereum address string. Got ${opts.to}. Ensure ${opts.to} is a valid Ara identity.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  // Get Current Gas Price
  let { average, fast } = await getGasPrice()
  info("Current Average Gas Price : ", average)

  let { to, val, gasPrice } = opts

  if(!gasPrice) {
    gasPrice = average/10
  }
  token.transfer({
    did: process.env.DID,
    password: process.env.pwd,
    to,
    val,
    gasPrice
  })
  .then(async (data) => {
    info('Receipt : ', data)
    info('Transfer Request completed successfully')

    // Get Updated Balance from the Blockchain
    let balance = await token.balanceOf(to)
    await redisClient.set(to, balance, 'EX', 60, (err, val) => {
      if (err) {
        debug(err)
      } else {
        debug(`Balance updated for ${to}`)
      }
    })

    // Update Balance to Rails Backend
    await request
    .post(`${basePath}/ara_identities/callback`)
    .send({ did: to, balance })
    .set('X-Apikey', apiKey)
    .set('X-AppToken', appToken)
    .set('Accept', 'application/json')
    .then((res) => {
      if (200 === res.status) {
        info(`Balance Updated in Rails Backend for ${to}`)
      }
    })
    .catch((err) => {
      debug(err)
    })
  })

  return true
}

module.exports = {
  submitTransaction
}
