const { writeIdentity } = require('ara-identity/util')
const { info, warn } = require('ara-console')
const redisClient = require('../services/redis.js')
const context = require('ara-context')()
const debug = require('debug')('ara:network:node:identity-manager:oncreate')
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
 * Middleware for creating an ARA Identity
 * @param  {[string]} req.body.passphrase Password for the ARA identity being created
 * @return {[object]} ARA ID with mnemonic, DDO & Wallet Address
 */

async function oncreate(req, res) {
  const timer = setTimeout(() => {
    res
      .status(status.requestTimeout)
      .send(msg.requestTimeout)
  }, REQUEST_TIMEOUT)

  try {
    if (undefined === req.body.passphrase || '' === req.body.passphrase) {
      res
        .status(status.badRequest)
        .send('Missing Passphrase parameter.\n')
        .end()
      clearTimeout(timer)
    } else {
      info('%s: Received create request', pkg.name)

      // Create & Write Ara Identity to disk
      const identifier = await aid.create({
        context,
        password: req.body.passphrase
      })
      await writeIdentity(identifier)
      const did = `did:ara:${identifier.publicKey.toString('hex')}`
      const walletAddress = await util.getAddressFromDID(did)

      // Write Entry into Redis Store
      redisClient.set(did, 0, 'EX', 60, (err, res) => {
        if (err) {
          debug(err)
        } else {
          debug(res)
        }
      })

      const response = {
        did,
        mnemonic: identifier.mnemonic,
        ddo: identifier.ddo,
        walletAddress
      }
      info('%s: New Identity created successfully: %s', pkg.name, did)

      res.status(status.ok)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(response))
      res.on('finish', () => { clearTimeout(timer) })
    }
  } catch (err) {
    res
      .status(status.internalServerError)
      .send('Create request failed. \n')
      .end()
    debug(err)
    clearTimeout(timer)
  }
}

module.exports = {
  oncreate
}
