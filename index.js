/* eslint-disable no-shadow */
/* eslint-disable no-warning-comments */
const { readFile, readFileSync } = require('fs')
const { info, warn, error } = require('ara-console')
const { unpack, keyRing } = require('ara-network/keys')
const { createChannel } = require('ara-network/discovery/channel')
const { writeIdentity } = require('ara-identity/util')
const { resolve } = require('path')
const bodyParser = require('body-parser')
const inquirer = require('inquirer')
const coalesce = require('defined')
const context = require('ara-context')()
const { DID } = require('did-uri')
const express = require('express')
const crypto = require('ara-crypto')
const debug = require('debug')('ara:network:node:identity-manager')
const https = require('https')
const http = require('http')
const pify = require('pify')
const aid = require('ara-identity')
const pkg = require('./package')
const ss = require('ara-secret-storage')
const rc = require('./rc')()

// in milliseconds
const REQUEST_TIMEOUT = 5000

const appRoute = '/1.0/identifiers'

const status = {
  internalServerError: 500,
  requestTimeout: 408,
  notImplemented: 501,
  badRequest: 400,
  notFound: 404,
  ok: 200,
}

const msg = {
  requestTimeout: `Request timed out after ${REQUEST_TIMEOUT} ms. \n`,
  authenticationFailed: 'Missing or invalid authentication credentials. \n',
  status: 'Ara Identity Manager up and running. \n'
}

const conf = {
  port: 8000,
  identity: null,
  password: null,
  secret: null,
  name: null,
  keyring: null,
  sslKey: null,
  sslCert: null,
  // Authentication@ TODO : Use public network key in keyring file to validate requests
  publicKey: null,
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
        describe: 'Ara Identity for the network node',
        type: 'string',
        required: true,
      })
      .option('secret', {
        alias: 's',
        describe: 'Shared secret key',
        type: 'string',
        // required: true, // see secret@TODO
      })
      .option('name', {
        alias: 'n',
        describe: 'Human readable network keys name.',
        type: 'string',
        required: true,
      })
      .option('keyring', {
        alias: 'k',
        describe: 'Path to ARA network keys',
        type: 'string',
        required: true,
      })
      .option('port', {
        alias: 'p',
        describe: 'Port for network node to listen on.',
        type: 'number'
      })
      .option('sslKey', {
        alias: 'K',
        describe: 'Path to ssl key file for the server',
        type: 'string',
      })
      .option('sslCert', {
        alias: 'C',
        describe: 'Path to ssl certificate file for the server',
        type: 'string',
      })
      // eslint-disable-next-line prefer-destructuring
    argv = program.argv
  }
  conf.port = select('port', argv, opts, conf)
  conf.name = select('name', argv, opts, conf)
  conf.secret = select('secret', argv, opts, conf)
  conf.keyring = select('keyring', argv, opts, conf)
  conf.identity = select('identity', argv, opts, conf)

  conf.path = select('path', argv, opts, conf, { path: rc.network.identity.root })
  conf.sslKey = select('sslKey', argv, opts, conf)
  conf.sslCert = select('sslCert', argv, opts, conf)
  conf.password = select('password', argv, opts, conf)

  return conf

  function select(k, ...args) {
    return coalesce(...args.map(o => o[k]))
  }
}

async function start() {
  if (channel) {
    return false
  }
  let password
  channel = createChannel({ })

  if (!conf.password) {
    ({ password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message:
          'Please enter the passphrase associated with the node identity.\n' +
          'Passphrase:'
      }
    ]))
  } else {
    // eslint-disable-next-line prefer-destructuring
    password = conf.password
  }

  if (0 !== conf.identity.indexOf('did:ara:')) {
    conf.identity = `did:ara:${conf.identity}`
  }
  const did = new DID(conf.identity)
  const publicKey = Buffer.from(did.identifier, 'hex')

  password = crypto.blake2b(Buffer.from(password))

  const hash = crypto.blake2b(publicKey).toString('hex')
  const path = resolve(conf.path, hash, 'keystore/ara')
  // secret@TODO: Enable & use conf.secret to perform handshake when archiving functionality added
  // const secret = Buffer.from(conf.secret)
  const keystore = JSON.parse(await pify(readFile)(path, 'utf8'))
  const secretKey = ss.decrypt(keystore, { key: password.slice(0, 16) })

  const keyring = keyRing(conf.keyring, { secret: secretKey })
  const buffer = await keyring.get(conf.name)

  if (!buffer.length) {
    error(`No discoveryKey found from network key named: ${conf.name} and keyring: ${conf.keyring}.`)
    error('Please try a diffrent key name (\'-n\' option) or keyring (\'-k\' option).')
  }

  const unpacked = unpack({ buffer })
  const { discoveryKey } = unpacked
  info('%s: discovery key:', pkg.name, discoveryKey.toString('hex'))

  // Server
  app = express()
  app.use(bodyParser.urlencoded({ extended: true }))

  app.post(`${appRoute}/`, oncreate)
  app.get(`${appRoute}/`, onresolve)
  app.get(`${appRoute}/status`, onstatus)

  app.all(`${appRoute}/update/`, (req, res) => {
    res
      .status(status.notImplemented)
      .send('`update` not implemented. \n')
  })

  app.all(`${appRoute}/delete/`, (req, res) => {
    res
      .status(status.notImplemented)
      .send('`delete` not implemented. \n')
  })

  if (conf.sslCert && conf.sslKey) {
    const certOpts = {
      key: readFileSync(resolve(conf.sslKey)),
      cert: readFileSync(resolve(conf.sslCert))
    }
    server = https.createServer(certOpts, app)
    info('Creating an _https_ server.')
  } else if (conf.sslCert || conf.sslKey) {
    warn('`sslCert` and `sslKey` are required for an https server. Only one was provided.')
    warn('Creating an _http_ server.')
    server = http.createServer(app)
  } else {
    info('Creating an _http_ server.')
    server = http.createServer(app)
  }

  server.listen(conf.port, onlisten)
  server.once('error', (err) => {
    if (err && 'EADDRINUSE' === err.code) { server.listen(0, onlisten) }
  })

  return true

  async function onstatus(req, res) {
    info('%s: Status ping received', pkg.name)
    res
      .status(status.ok)
      .send(msg.status)
      .end()
  }

  async function oncreate(req, res) {
    const timer = setTimeout(() => {
      res
        .status(status.requestTimeout)
        .send(msg.requestTimeout)
    }, REQUEST_TIMEOUT)

    // Authentication @TODO - Add Authentication mechanism to validate requests
    // Use public network key (conf.publicKey) from the keyring file

    try {
      if (undefined === req.headers.authentication || discoveryKey.toString('hex') !== req.headers.authentication) {
        res
          .status(status.badRequest)
          .send(msg.authenticationFailed)
          .end()
        clearTimeout(timer)
      } else if (undefined === req.body.passphrase) {
        res
          .status(status.badRequest)
          .send('Missing Passphrase parameter. Try `?passphrase=somepassphrase` \n')
          .end()
        clearTimeout(timer)
      } else if ('' === req.body.passphrase) {
        res
          .status(status.badRequest)
          .send('Missing Passphrase parameter value. Try `?passphrase=somepassphrase` \n')
          .end()
        clearTimeout(timer)
      } else {
        res.status(status.ok)
        info('%s: Received create request', pkg.name)
        const identifier = await aid.create({
          context,
          password: req.body.passphrase
        })
        const did = `did:ara:${identifier.publicKey.toString('hex')}`
        await writeIdentity(identifier)
        const response = {
          did,
          mnemonic: identifier.mnemonic,
          ddo: identifier.ddo
        }
        info('%s: New Identity created successfully: %s', pkg.name, did)

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

  async function onresolve(req, res) {
    const timer = setTimeout(() => {
      res
        .status(status.requestTimeout)
        .send(msg.requestTimeout)
    }, REQUEST_TIMEOUT)

    try {
      if (undefined === req.headers.authentication || discoveryKey.toString('hex') !== req.headers.authentication) {
        res
          .status(status.badRequest)
          .send(msg.authenticationFailed)
          .end()
        clearTimeout(timer)
      } else if (undefined === req.query.did) {
        res
          .status(status.badRequest)
          .send('Missing DID parameter. Try `?did=did:ara:somedid` \n')
          .end()
        clearTimeout(timer)
      } else if ('' === req.query.did) {
        res
          .status(status.badRequest)
          .send('Missing DID parameter value. Try `?did=did:ara:somedid` \n')
          .end()
        // clearTimeout(timer)
      } else {
        if (0 !== req.query.did.indexOf('did:ara:')) {
          req.query.did = `did:ara:${req.query.did}`
        }
        res.status(status.ok)
        info('%s: Resolve request received for: %s', pkg.name, req.query.did)

        try {
          const did = new DID(req.query.did)
          const publicKey = Buffer.from(did.identifier, 'hex')
          const hash = crypto.blake2b(publicKey).toString('hex')
          const path = resolve(conf.path, hash, 'ddo.json')
          const response = JSON.parse(await pify(readFile)(path, 'utf8'))
          info('%s: Resolve request completed successfully!!!!', pkg.name)

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(response))
          res.on('finish', () => { clearTimeout(timer) })
        } catch (e) {
          res
            .status(status.notFound)
            .send(`Could not resolve DID: ${req.query.did}\n`)
            .end()
          debug(status.notFound, e)
          clearTimeout(timer)
        }
      }
    } catch (err) {
      res
        .status(status.internalServerError)
        .send(`Could not resolve DID: ${req.query.did}\n`)
        .end()
      debug(status.internalServerError, err)
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
