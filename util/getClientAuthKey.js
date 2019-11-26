const { keyRing, unpack } = require('ara-network/keys')
const { error } = require('ara-console')
const isBuffer = require('is-buffer')
const debug = require('debug')('ara:network:node:identity-manager:util')

/**
 * Returns an Authentication key derived from the public keyring file
 * @param  {object} opts
 * @param  {string/buffer} opts.secret
 * @param  {string} opts.network
 * @param  {string} opts.keyring Public keyring file path
 * @return {string} 64 byte authentication key
 */

async function getClientAuthKey(opts) {
  if (null == opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting options to be an object.')
  }

  if ('string' !== typeof opts.secret && !isBuffer(opts.secret)) {
    throw new TypeError('Expecting shared secret to be a string or buffer.')
  }

  if (!opts.secret || 0 === opts.secret.length) {
    throw new TypeError('Shared secret cannot be empty.')
  }

  if (!opts.network || 'string' !== typeof opts.network) {
    throw new TypeError('Expecting network name for the archiver.')
  }

  if (!opts.keyring) {
    throw new TypeError('Expecting network keys public keyring.')
  }

  if (-1 === opts.keyring.indexOf('.pub')) {
    debug(`Using keyring: ${opts.keyring}, which may not be a public keyring.`)
  }

  try {
    const secret = Buffer.from(opts.secret)
    const keyring = keyRing(opts.keyring, { secret })

    /* keyring.once('error', (err) => {
      throw new Error(err)
    }) */

    keyring.ready()

    const buffer = await keyring.get(opts.network)

    if (!buffer.length) {
      error(`No discoveryKey found from network key named: ${opts.network} and keyring: ${opts.keyring}.`)
      error('Please try a diffrent key name (\'-n\' option) or keyring (\'-k\' option).')
    }

    const unpacked = unpack({ buffer })
    const { discoveryKey } = unpacked
    return {
      discoveryKey,
      authenticationKey: Buffer.concat([ discoveryKey, unpacked.domain.publicKey ]).toString('hex')
    }
  } catch (err) {
    return new Error(err)
  }
}

module.expors = {
  getClientAuthKey
}
