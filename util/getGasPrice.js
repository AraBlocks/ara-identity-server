const superagent = require('superagent')
const { gasAPI } = require('../config')
const debug = require('debug')('ara:network:node:identity-manager:getGasPrice')

/**
 * Function to get current Gas Price Estimates
 * @return {[object]} All gas price estimates
 */
async function getGasPrice() {
  try {
    const res = await superagent.get(gasAPI)
    const { body } = res
    return body
  } catch (err) {
    debug(err)
  }
  return true
}

module.exports = {
  getGasPrice
}
