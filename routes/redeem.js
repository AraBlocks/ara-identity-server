const { info, warn } = require('ara-console')
const redisClient = require('../services/redis.js')
const { token } = require('ara-contracts')
const context = require('ara-context')()
const debug = require('debug')('ara:network:node:identity-manager:ontransfer')
const util = require('ara-util')
const pkg = require('../package')
const aid = require('ara-identity')

const {
  server_values,
  status,
  msg } = require('../config')

const {
  REQUEST_TIMEOUT,
  TRANSFER_TIMEOUT,
  DEFAULT_TOKEN_COUNT,
  MAX_TOKEN_PER_ACCOUNT
} = server_values



/**
 * Middleware to Redeem Earned Ara Tokens
 * @param  {[String]} req.params.did Ara Identity from which tokens need to be redeemed
 * @return {[Object]} Status Object
 */

async function onredeem(req, res) {
  const timer = setTimeout(() => {
    res
      .status(status.requestTimeout)
      .send(msg.requestTimeout)
  }, REQUEST_TIMEOUT)

  try {
    if (undefined === req.headers.authentication || conf.authenticationKey !== req.headers.authentication) {
      res
        .status(status.authenticationError)
        .send(msg.authenticationFailed)
        .end()
      clearTimeout(timer)
    } else {
      if (0 !== req.params.did.indexOf('did:ara:')) {
        req.params.did = `did:ara:${req.params.did}`
      }
      res.status(status.ok)
      info('%s: Transfer request for', req.params.did)
      const recipient = 'did:ara:89b83d3deab9507889710bb5dbaf5e863435c05193dcb128f6488e0bd42a492b'
      const { tokens } = req.body
      const password = req.body.passphrase

      const receipt = token.transfer({
        did: req.params.did,
        password,
        to: recipient,
        val: tokens
      })

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(receipt))
      res.on('finish', () => { clearTimeout(timer) })
      info('%s: Redeem request submitted successfully!!!!', pkg.name)
    }
  } catch (err) {
    warn(err)
    res
      .status(status.internalServerError)
      .send('Transfer request failed. \n')
      .end()
    debug(err)
    clearTimeout(timer)
  }
}

module.exports = {
  onredeem
}
