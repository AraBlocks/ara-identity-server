const { info, warn } = require('ara-console')
const { token } = require('ara-contracts')
const debug = require('debug')('ara:network:node:identity-manager:ontransfer')
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
    if (0 !== req.params.did.indexOf('did:ara:')) {
      req.params.did = `did:ara:${req.params.did}`
    }
    res.status(status.ok)
    info('%s: Transfer request for', req.params.did)
    const recipient = process.env.DID
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
