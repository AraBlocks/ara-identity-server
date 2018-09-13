const { unpack, keyRing, derive } = require('ara-network/keys')
const { readFile } = require('fs')
const { resolve } = require('path')
const { error } = require('ara-console')
const isBuffer = require('is-buffer')
const { DID } = require('did-uri')
const crypto = require('ara-crypto')
const debug = require('debug')('ara:network:node:identity-manager:util')
const pify = require('pify')
const ss = require('ara-secret-storage')
const rc = require('./rc')()

const DID_IDENTIFIER_LENGTH = 64
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

/**
 * Returns an Authentication key derived from the secret keyring file
 * @param  {object} opts
 * @param  {string} opts.identity
 * @param  {string} opts.path (Optional)
 * @param  {string} opts.password
 * @param  {string/buffer} opts.secret
 * @param  {string} opts.network
 * @param  {string} opts.keyring Public keyring file path
 * @return {string} 64 byte authentication key
 */

async function getServerAuthKey(opts) {
  if (null == opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting options to be an object.')
  }

  if (null == opts.identity || 'string' !== typeof opts.identity) {
    throw new TypeError('Expecting identity for the given keyring file.')
  }

  if (null == opts.path) {
    // eslint-disable-next-line no-param-reassign
    opts.path = rc.network.identity.root
  }

  if (null == opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting password for the given identity.')
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
    throw new TypeError('Expecting network keys secret keyring.')
  }

  if (0 === opts.keyring.indexOf('.pub')) {
    debug(`Using keyring: ${opts.keyring}, which may not be a secret keyring.`)
  }

  const did = new DID(opts.identity)

  if (!did.identifier || DID_IDENTIFIER_LENGTH !== did.identifier.length) {
    throw new TypeError('Invalid DID identifier length.')
  }
  const publicKey = Buffer.from(did.identifier, 'hex')

  try {
    // Read keystore/ara for the DID
    const password = crypto.blake2b(Buffer.from(opts.password))
    const hash = crypto.blake2b(publicKey).toString('hex')
    const path = resolve(opts.path, hash, 'keystore/ara')

    // Derive secretKey for the DID
    const keystore = JSON.parse(await pify(readFile)(path, 'utf8'))
    const secret = Buffer.from(opts.secret)
    const secretKey = ss.decrypt(keystore, { key: password.slice(0, 16) })

    // Derive the domain keypair using the secret key
    const keypair = derive({ secretKey, name: opts.network })
    const s = crypto.blake2b(secret, 32)
    const bs = crypto.blake2b(keypair.secretKey, 32)
    const seed = crypto.blake2b(Buffer.concat([ s, bs ]), 32)
    const K = crypto.curve25519.keyPair(seed)

    // Derive the discoveryKey for the keyring file
    const keyring = keyRing(opts.keyring, { secret: secretKey })
    const buffer = await keyring.get(opts.network)

    if (!buffer.length) {
      error(`No discoveryKey found from network key named: ${opts.network} and keyring: ${opts.keyring}.`)
      error('Please try a diffrent key name (\'-n\' option) or keyring (\'-k\' option).')
    }

    const unpacked = unpack({ buffer })
    const { discoveryKey } = unpacked

    return {
      discoveryKey,
      authenticationKey: Buffer.concat([ discoveryKey, K.publicKey ]).toString('hex')
    }
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = {
  getClientAuthKey,
  getServerAuthKey
}
