const { info } = require('ara-console')
const redisClient = require('../services/redis.js')
const { token } = require('ara-contracts')
const debug = require('debug')('ara:network:node:identity-manager:onbalance')
const pkg = require('../package')

const {
  serverValues,
  status,
  msg
} = require('../config')

const {
  REQUEST_TIMEOUT
} = serverValues

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

    await redisClient.get(did, (error, bal) => {
      balance = bal
    })

    if (null === balance) {
      debug('DID not found or balance expired, checking from blockchain')
      balance = await token.balanceOf(did)
      redisClient.set(did, balance, 'EX', 60, (err, val) => {
        if (err) {
          debug(err)
        } else {
          debug(`Balance updated for ${did} from blockchain`)
        }
      })
    }

    res.status(status.ok)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ balance }))
    res.on('finish', () => { clearTimeout(timer) })
    debug('%s: Balance request completed successfully.', pkg.name)
  } catch (err) {
    debug(err)
    clearTimeout(timer)
    res
      .status(status.internalServerError)
      .send('Balance request failed. \n')
      .end()
  }
}

module.exports = {
  onbalance
}
