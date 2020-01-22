const { info } = require('ara-console')
const { token } = require('ara-contracts')
const debug = require('debug')('ara:network:node:identity-manager:ontransfer')
const Queue = require('bull')
const pkg = require('../package')

const transferQueue = new Queue('Ara Transfer')

const {
  serverValues,
  status
} = require('../config')

const {
  MAX_TOKEN_PER_ACCOUNT
} = serverValues

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
    if (undefined === req.query.points) {
      res
        .status(status.badRequest)
        .send('Missing/Invalid points requested.\n')
        .end()
    }

    if (undefined === req.query.mission_id) {
      res
        .status(status.badRequest)
        .send('Missing mission ID information in request.\n')
        .end()
    }

    if (undefined === req.query.mission_accomplishment_id) {
      res
        .status(status.badRequest)
        .send('Missing mission ID information in request.\n')
        .end()
    }

    info('%s: Transfer request for', pkg.name, req.params.did)
    const recipient = req.params.did
    const tokens = parseInt(req.query.points, 10)
    const balance = await token.balanceOf(req.params.did)

    const newBalance = parseInt(balance, 10) + parseInt(tokens, 10)
    // Check Balance before processing Transfer request
    if (newBalance > MAX_TOKEN_PER_ACCOUNT) {
      res.status(status.badRequest)
      res.end(`Request failed. Only ${MAX_TOKEN_PER_ACCOUNT} allowed per user`)
    } else {
      try {
        transferQueue.add({
          to: req.params.did,
          val: tokens,
          missionId: req.query.mission_id,
          accomplishmentId: req.query.mission_accomplishment_id
        })
        info('%s: Transfer request submitted successfully.', pkg.name)
        res.status(status.ok)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          created_at: now,
          did: recipient,
          tokens_requested: tokens
        }))
      } catch (err) {
        debug(err)
        res
          .status(status.internalServerError)
          .send('Transfer request failed. \n')
          .end()
      }
    }
  } catch (err) {
    debug(err)
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
