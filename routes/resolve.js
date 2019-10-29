const { parse: parseDID } = require('did-uri')
const { info } = require('ara-console')
const { readFile } = require('fs')
const { resolve } = require('path')
const { DID } = require('did-uri')
const crypto = require('ara-crypto')
const debug = require('debug')('ara:network:node:identity-manager:onresolve')
const pify = require('pify')
const aid = require('ara-identity')
const pkg = require('../package')
const rc = require('../config/rc')()

const {
  serverValues,
  status,
  msg
} = require('../config')

const {
  REQUEST_TIMEOUT
} = serverValues

/**
 * Middleware for resolving Ara Identities
 * @param  {[string]} req.params.did Ara Identity DID
 * @return {[object]} Returns an Object with DDO
 */

async function onresolve(req, res) {
  const now = Date.now()
  const araPath = rc.network.identity.root
  const timer = setTimeout(() => {
    res
      .status(status.requestTimeout)
      .send(msg.requestTimeout)
  }, REQUEST_TIMEOUT)

  try {
    if (0 !== req.params.did.indexOf('did:ara:')) {
      req.params.did = `did:ara:${req.query.did}`
    }
    res.status(status.ok)
    info('%s: Resolve request received for: %s', pkg.name, req.params.did)

    try {
      const { did } = req.params
      const ddo = await aid.resolve(did)

      const duration = Date.now() - now
      const response = createResponse({ did, ddo, duration })
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(response))
      res.on('finish', () => { clearTimeout(timer) })
      debug('%s: Resolve request completed successfully.', pkg.name)
    } catch (e) {
      res
        .status(status.notFound)
        .send(`Could not resolve DID: ${req.params.did}\n`)
        .end()
      debug(status.notFound, e)
      clearTimeout(timer)
    }
  } catch (err) {
    debug(err)
    res
      .status(status.internalServerError)
      .send(`Could not resolve DID: ${req.params.did}\n`)
      .end()
    debug(status.internalServerError, err)
    clearTimeout(timer)
  }
}

function createResponse(opts) {
  return {
    didDocument: opts.ddo,
    didReference: parseDID(opts.did),
    methodMetadata: {},
    resolverMetadata: {
      retrieved: new Date(),
      duration: opts.duration,
      driverId: 'did:ara',
      driver: 'HttpDriver',
    }
  }
}

module.exports = {
  onresolve
}
