const { writeIdentity } = require('ara-identity/util')
const { info, warn } = require('ara-console')
const redisClient = require('../services/redis.js')
const { token } = require('ara-contracts')
const context = require('ara-context')()
const debug = require('debug')('ara:network:node:identity-manager:onbalance')
const util = require('ara-util')
const pkg = require('../package')
const aid = require('ara-identity')

const {
  server_values,
  status,
  msg } = require('../config')

const {
  REQUEST_TIMEOUT
} = server_values

/**
 * Middleware to query Ara Balance of a DID
 * @param  {[type]} req.params.did Input DID to check balance for
 * @return {[Object]} Wallet Balance in Ara
 */

async function onbalance(req, res) {
  const timer = setTimeout(() => {
    res
      .status(status.requestTimeout)
      .send(msg.requestTimeout)
  }, REQUEST_TIMEOUT)

  try {
    if (0 !== req.params.did.indexOf('did:ara:')) {
      req.params.did = `did:ara:${req.query.did}`
    }

    info('%s: Balance request for %s', pkg.name, req.params.did)
    const { did } = req.params
    let balance = null
    redisClient.get(did, async (err, bal) => {
      if (null == bal) {
        debug('Balance expired, retrieving from blockchain')
        balance = await token.balanceOf(did)
        redisClient.set(did, balance, 'EX', 60, (err, res) => {
          if (err) {
            debug(err)
          } else {
            debug(res)
          }
        })
      } else {
        balance = bal
      }

      res.status(status.ok)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ balance }))
      res.on('finish', () => { clearTimeout(timer) })
      debug('%s: Balance request completed successfully.', pkg.name)
    })
  } catch (err) {
    debug(err)
    res
      .status(status.internalServerError)
      .send('Balance request failed. \n')
      .end()
    debug(err)
    clearTimeout(timer)
  }
}

module.exports = {
  onbalance
}
