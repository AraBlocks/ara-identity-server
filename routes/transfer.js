const { info, warn } = require('ara-console')
const { token } = require('ara-contracts')
const debug = require('debug')('ara:network:node:identity-manager:ontransfer')
const pkg = require('../package')

const {
  serverValues,
  status
} = require('../config')

const {
  DEFAULT_TOKEN_COUNT,
  MAX_TOKEN_PER_ACCOUNT
} = serverValues

/**
 * Middleware to allocate Ara Rewards
 * @param  {[type]} req.params.did ARA DID for which rewards are being allocated
 * @return {[type]} Timestamp
 */

async function ontransfer(req, res) {
  function onhash(txHash) {
    info('Transaction hash: ', txHash)
  }

  function onreceipt(receipt) {
    info('Transaction Receipt: ', receipt)
  }

  function onconfirmation(confNumber, receipt) {
    info('Confirmation #: ', confNumber)
    info('Confirmation Receipt: ', receipt)
  }

  function onmined(data) {
    info('Ara Token Transfer completed successfully')
    info('Confirmation: ', data)
  }

  function onerror(err) {
    debug(err)
  }

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
