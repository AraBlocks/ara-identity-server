const { createChannel } = require('ara-network/discovery/channel')
const secrets = require('ara-network/secrets')
const { toHex } = require('ara-identity/util')
const { DID } = require('did-uri')
const crypto = require('ara-crypto')
const debug = require('debug')('ara:identity:resolve')
const fetch = require('got')
const path = require('path')
const pify = require('pify')
const fs = require('fs')
const rc = require('ara-identity/rc')()

const kDIDIdentifierLength = 64
// in milliseconds
const kResolutionTimeout = 5000
const kDIDMethod = 'ara'
const kMaxPeers = 8


test()

async function test(){
  const res = await resolve("Hello123")
  console.log(res)
}

async function resolve(password) {
  const opts = {
    key: "manager"
  }
  const doc = await secrets.load(opts)
  const { keystore } = (doc.public || doc.secret)
  const managers = []
  const channel = createChannel()
  const keys = secrets.decrypt({ keystore }, { key: "manager" })
  let timeout = null
  /* eslint-disable no-param-reassign */
  if (null === opts.timeout || 'number' !== typeof opts.timeout) {
    opts.timeout = kResolutionTimeout
  }
  /* eslint-enable no-param-reassign */

  return pify((done) => {
    channel.on('peer', onpeer)
    channel.join(keys.discoveryKey)
    timeout = setTimeout(create, opts.timeout)

    function onpeer(id, peer, type) {
      console.log(peer)
      if (managers.push({ id, peer, type }) < kMaxPeers) {
        create()
      } else {
        cleanup()
      }
    }

    async function create() {
      try {
        clearTimeout(timeout)
        timeout = setTimeout(create, opts.timeout)
        if (managers.length) {
          console.log("Calling Manager")
          const { peer } = managers.shift()
          const { host, port } = peer
          const uri = `http://${host}:${port}/api/v1/create/?passphrase=${password}`
          console.log(uri)
          try {
            const res = await fetch(uri, {method: "POST"})
            if (res.body){
              done(null, JSON.parse(res.body))
            }
            else {
              done(null, res)
            }
            await cleanup()
          } catch (err) {
            process.nextTick(create)
          }
        } else {
          return done(Object.assign(
            new Error('Could not resolve DID.'),
            { status: 404, code: 'ENOTFOUND' }
          ))
        }
        return null
      } catch (err){
      }
    }

    function cleanup() {
      clearTimeout(timeout)
      channel.removeListener('peer', onpeer)
      channel.destroy()
    }
  })()
}

module.exports = {
  resolve
}
