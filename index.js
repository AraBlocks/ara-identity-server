/* eslint-disable no-shadow */
const debug = require('debug')('ara:network:node:identity-manager')
const { createChannel } = require('ara-network/discovery/channel')
const { unpack, keyRing } = require('ara-network/keys')
const { writeIdentity } = require('ara-identity/util')
const { readFile, readFileSync } = require('fs')
const { info, warn } = require('ara-console')
const ss = require('ara-secret-storage')
const context = require('ara-context')()
const inquirer = require('inquirer')
const crypto = require('ara-crypto')
const aid = require('ara-identity')
const { resolve } = require('path')
const coalesce = require('defined')
const { DID } = require('did-uri')
const express = require('express')
const pkg = require('./package')
const https = require('https')
const http = require('http')
const aid = require('ara-identity')
const pkg = require('./package')
const ss = require('ara-secret-storage')
const rc = require('./rc')()

// in milliseconds
const kRequestTimeout = 5000

let conf = {
  port: 8000,
  identity: null,
  secret: null,
  name: null,
  keyring: null,
  sslKey: null,
  sslCert: null
}

let server = null
let channel = null
let app = null

async function getInstance() {
  return server
}

async function configure(opts, program) {
  let argv = {}
  if (program) {
    program
      .option('identity', {
        alias: 'i',
        describe: 'Ara Identity for the network node.',
        required: true,
      })
      .option('secret', {
        alias: 's',
        describe: 'Shared secret key',
        required: true,
      })
      .option('name', {
        alias: 'n',
        describe: 'Human readable network keys name.',
        required: true,
      })
      .option('keyring', {
        alias: 'k',
        describe: 'Path to ARA network keys.',
        required: true,
      })
      .option('port', {
        alias: 'p',
        describe: 'Port for network node to listen on.'
      })
      .option('sslKey', {
        alias: 'sk',
        describe: 'Path to ssl key file for the server'
      })
      .option('sslCert', {
        alias: 'sc',
        describe: 'Path to ssl certificate file for the server'
      })
      // eslint-disable-next-line prefer-destructuring
    argv = program.argv
  }
  conf.port = select('port', argv, opts, conf)
  conf.name = select('name', argv, opts, conf)
  conf.secret = select('secret', argv, opts, conf)
  conf.keyring = select('keyring', argv, opts, conf)
  conf.identity = select('identity', argv, opts, conf)
  conf.sslKey = select('sslKey', argv, opts, conf)
  conf.sslCert = select('sslCert', argv, opts, conf)

  return conf

  function select(k, ...args) {
    return coalesce(...args.map(o => o[k]))
  }
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
  if (0 !== conf.identity.indexOf('did:ara:')) {
    conf.identity = `did:ara:${conf.identity}`
  }
  const did = new DID(conf.identity)
  const publicKey = Buffer.from(did.identifier, 'hex')

  password = crypto.blake2b(Buffer.from(password))

  const hash = crypto.blake2b(publicKey).toString('hex')
  const path = resolve(rc.network.identity.root, hash, 'keystore/ara')
  // const secret = Buffer.from(conf.secret)
  const keystore = JSON.parse(await pify(readFile)(path, 'utf8'))
  const secretKey = ss.decrypt(keystore, { key: password.slice(0, 16) })

  const keyring = keyRing(argv.keyring, { secret: secretKey })
  const buffer = await keyring.get(argv.name)

  if ( !buffer.length ) {
    error(`No discoveryKey found from network key named: ${argv.name} and keyring: ${argv.keyring}.`)
    error(`Please try a diffrent key name ('-n' option) or keyring ('-k' option).`)
  }

  const unpacked = unpack({ buffer })

  const { discoveryKey } = unpacked
  info('%s: discovery key:', pkg.name, discoveryKey.toString('hex'))

  app = express()

  app.post('/api/v1/create/', oncreate)
  app.get('/api/v1/resolve/', onresolve)

  if (conf.sslCert && conf.sslKey) {
    const certOpts = {
      key: readFileSync(resolve(conf.sslKey)),
      cert: readFileSync(resolve(conf.sslCert))
    }
    server = https.createServer(certOpts, app)
  } else {
    server = http.createServer(app)
  }

  server.listen(argv.port, onlisten)
  server.once('error', (err) => {
    if (err && 'EADDRINUSE' === err.code) { server.listen(0, onlisten) }
  })

  return true

  async function oncreate(req, res) {
    const timer = setTimeout(() => { res.status(408).send('Request Timed Out') }, kRequestTimeout)
    try {
      if (undefined === req.query.passphrase) {
        res.status(401).send('Missing Passphrase').end()
        clearTimeout(timer)
      } else {
        info('%s: Received create request', pkg.name)
        const identifier = await aid.create({ context, password: req.query.passphrase })
        const id = `did:ara:${identifier.publicKey.toString('hex')}`
        await writeIdentity(identifier)
        const response = {
          did: id,
          mnemonic: identifier.mnemonic
        }
        info('%s: New Identity created successfully: %s', pkg.name, id)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(response))
        res.on('finish', () => { clearTimeout(timer) })
      }
    } catch (err) {
      debug(err)
      res.status(401).send('Create request failed').end()
      clearTimeout(timer)
    }
  }

  async function onresolve(req, res) {
    const timer = setTimeout(() => { res.status(408).send('Request Timed Out') }, kRequestTimeout)
    try {
      if (undefined === req.query.did) {
        res.status(401).send('Missing DID').end()
        clearTimeout(timer)
      } else {
        if (0 !== req.query.did.indexOf('did:ara:')) {
          req.query.did = `did:ara:${req.query.did}`
        }
        info('%s: Resolve request received for: %s', pkg.name, req.query.did)
        const did = new DID(req.query.did)
        const publicKey = Buffer.from(did.identifier, 'hex')
        const hash = crypto.blake2b(publicKey).toString('hex')
        const path = resolve(rc.network.identity.root, hash, 'ddo.json')
        const ddo = JSON.parse(await pify(readFile)(path, 'utf8'))
        info('%s: Resolve request completed successfully!!!!', pkg.name)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(ddo))
        res.on('finish', () => { clearTimeout(timer) })
      }
    } catch (err) {
      debug(err)
      res.status(401).send('Resolve request failed. Invalid DID').end()
      clearTimeout(timer)
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
  channel.destroy()
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
