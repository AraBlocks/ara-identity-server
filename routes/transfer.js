const { writeIdentity } = require('ara-identity/util')
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
 * Middleware to allocate Ara Rewards
 * @param  {[type]} req.params.did ARA DID for which rewards are being allocated
 * @return {[type]} Timestamp
 */

async function ontransfer(req, res) {
  const now = new Date()

  try {
    if (0 !== req.params.did.indexOf('did:ara:')) {
      req.params.did = `did:ara:${req.params.did}`
    }
    // Check Balance before processing Transfer request

    info('%s: Transfer request for', pkg.name, req.params.did)
    const recipient = req.params.did
    const tokens = req.body.tokens || DEFAULT_TOKEN_COUNT
    const balance = await token.balanceOf(req.params.did)
    if ((parseInt(balance, 10) + parseInt(tokens, 10)) > MAX_TOKEN_PER_ACCOUNT) {
      res.status(status.ok)
      res.end(`Cannot complete transfer request. Only ${MAX_TOKEN_PER_ACCOUNT} allowed per user`)
    } else {
      try {

        function onhash(txHash) {
          info("Transaction hash: ", txHash)
        }

        function onreceipt(receipt) {
          info("Transaction Receipt: ", receipt)
        }

        function onconfirmation(confNumber, receipt) {
          info("Confirmation #: ", confNumber)
          info("Confirmation Receipt: ", receipt)
        }

        function onmined(data) {
          info("Ara Token Transfer completed successfully")
          info("Confirmation: ", data)
        }

        function onerror(err) {
          error(err)
        }

        token.transfer({
          did: process.env.DID,
          password: process.env.pwd,
          to: recipient,
          val: tokens,
          onhash,
          onreceipt,
          onconfirmation,
          onerror,
          onmined
        })
      } catch (err) {
        debug(err)
        res
          .status(status.internalServerError)
          .send('Transfer request failed. \n')
          .end()
      }
      info('%s: Transfer request submitted successfully.', pkg.name)
      res.status(status.ok)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        created_at: now,
        did: recipient,
        tokens_requested: tokens
      }))
    }
  } catch (err) {
    warn(err)
    res
      .status(status.internalServerError)
      .send('Transfer request failed. \n')
      .end()
    debug(err)
  }
}

module.exports = {
  ontransfer
}
