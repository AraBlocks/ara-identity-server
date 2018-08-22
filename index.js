const debug = require('debug')('ara:network:node:identity-manager')
const { unpack, keyRing, derive } = require('ara-network/keys')
const { createChannel } = require('ara-network/discovery/channel')
const { createServer } = require('ara-network/discovery')
const { info, warn, error } = require('ara-console')
const ss = require('ara-secret-storage')
const context = require('ara-context')()
const crypto = require('ara-crypto')
const aid = require('ara-identity')
const { readFile } = require('fs')
const { writeIdentity } = require('ara-identity/util')
const { DID } = require('did-uri')
const { resolve } = require('path')
const express = require('express')
const inquirer = require('inquirer')
const extend = require('extend')
const http = require('http')
const rc = require('./rc')()
const pify = require('pify')
const pkg = require('./package')

// in milliseconds
const kRequestTimeout = 10000

const conf = {
  // in milliseconds
  'dns-announce-interval': 1000 * 60 * 2,
  // in milliseconds
  'dht-announce-interval': 1000 * 60 * 2,
  keystore: null,
  port: 8000,
  key: null
}

let server = null
let channel = null
let app = null

async function getInstance() {
  return server
}

async function configure(opts, program) {
  if (program) {
    const { argv } = program
      .option('identity', {
        alias: 'i',
        describe: 'Ara Identity for the network node'
      })
      .option('secret', {
        alias: 's',
        describe: 'Shared secret key'
      })
      .option('name', {
        alias: 'n',
        describe: 'Human readable network keys name.'
      })
      .option('keyring', {
        alias: 'k',
        describe: 'Path to ARA network keys'
      })
      .option('port', {
        alias: 'p',
        describe: 'Port for network node to listen on.'
      })
  }

  return extend(true, conf, opts)
}

async function start(argv) {
  if (channel) {
    return false
  }

  channel = createChannel({ })

  let { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message:
        'Please enter the passphrase associated with the node identity.\n' +
        'Passphrase:'
    }
  ])
  if (0 !== argv.identity.indexOf('did:ara:')) {
    argv.identity = `did:ara:${conf.identity}`
  }
  const did = new DID(argv.identity)
  const publicKey = Buffer.from(did.identifier, 'hex')

  password = crypto.blake2b(Buffer.from(password))

  const hash = crypto.blake2b(publicKey).toString('hex')
  const path = resolve(rc.network.identity.root, hash, 'keystore/ara')
  const secret = Buffer.from(argv.secret)
  const keystore = JSON.parse(await pify(readFile)(path, 'utf8'))
  const secretKey = ss.decrypt(keystore, { key: password.slice(0, 16) })

  const keyring = keyRing(argv.keyring, { secret: secretKey })
  const buffer = await keyring.get(argv.name)
  const unpacked = unpack({ buffer })

  const { discoveryKey } = unpacked

  info('%s: discovery key:', pkg.name, discoveryKey.toString('hex'))

  app = express()

  app.post('/api/v1/create/', oncreate)
  app.post('/api/v1/resolve/', onresolve)

  server = http.createServer(app)
  channel = createChannel({
    dht: { interval: conf['dht-announce-interval'] },
    dns: { interval: conf['dns-announce-interval'] },
  })
  server.listen(argv.port, onlisten)
  server.once('error', (err) => {
    if (err && 'EADDRINUSE' === err.code) { server.listen(0, onlisten) }
  })
  return true

  async function oncreate(req, res) {
    let id = setTimeout(() => { res.status(408).send('Request Timed Out') }, kRequestTimeout)
    try{
      if (undefined === req.query.passphrase) {
        res.status(401).send("Missing Passphrase").end()
      }
      else {
        const password = req.query.passphrase
        const identifier = await aid.create({ context, password })
        await writeIdentity(identifier)
        const response = {
          mnemonic: identifier.mnemonic,
          ddo: identifier.ddo
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(response))
        res.on('finish', () => { clearTimeout(id) })
      }
    } catch (err){
      debug(err)
    }
  }

  async function onresolve(req, res) {
    let id = setTimeout(() => { res.status(408).send('Request Timed Out') }, kRequestTimeout)
    try{
      if (undefined === req.query.did) {
        res.status(401).send("Missing DID").end()
      }
      else {
        if (0 !== req.query.did.indexOf('did:ara:')) {
          req.query.did = `did:ara:${req.query.did}`
        }
        const did = new DID(req.query.did)
        const publicKey = Buffer.from(did.identifier, 'hex')
        const hash = crypto.blake2b(publicKey).toString('hex')
        const path = resolve(rc.network.identity.root, hash, 'ddo.json')
        const ddo = JSON.parse(await pify(readFile)(path, 'utf8'))
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(ddo))
        res.on('finish', () => { clearTimeout(id) })
      }
    } catch (err){
      debug(err)
    }
  }

  function onlisten() {
    const { port } = server.address()
    info('identity-manager: Server listening on port %s', port)
    announce()
  }

  function announce() {
    const { port } = server.address()
    info('identity-manager: Announcing %s on port %s', discoveryKey.toString('hex'), port)
    channel.join(discoveryKey, port)
  }
}

async function stop() {
  if (null == server) {
    return false
  }

  warn('identity-manager: Stopping the http server')
  server.close(onclose)
  return true

  function onclose() {
    server = null
  }
}

module.exports = {
  getInstance,
  configure,
  start,
  stop,
}
