/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-warning-comments */
const { getClientAuthKey, getServerAuthKey } = require('./util')
const { readFile } = require('fs')
const { info, warn } = require('ara-console')
const { parse: parseDID } = require('did-uri')
const { createChannel } = require('ara-network/discovery/channel')
const { writeIdentity } = require('ara-identity/util')
const { resolve } = require('path')
const bodyParser = require('body-parser')
const { token } = require('ara-contracts')
const inquirer = require('inquirer')
const coalesce = require('defined')
const context = require('ara-context')()
const { DID } = require('did-uri')
const express = require('express')
const crypto = require('ara-crypto')
const redis = require('redis')
const debug = require('debug')('ara:network:node:identity-manager')
const http = require('http')
const pify = require('pify')
const util = require('ara-util')
const aid = require('ara-identity')
const pkg = require('./package')
const rc = require('./rc')()

// in milliseconds
const REQUEST_TIMEOUT = 5000

const DEFAULT_TOKEN_COUNT = 100
const MAX_TOKEN_PER_ACCOUNT = 500

const appRoute = '/1.0/identifiers'

const domain = 'http://mrmanager.ara.one'

const status = {
  internalServerError: 500,
  requestTimeout: 408,
  notImplemented: 501,
  badRequest: 400,
  notFound: 404,
  ok: 200,
  authenticationError: 401
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
  network: null,
  keyring: null,
  sslKey: null,
  sslCert: null,
  // Authentication@ TODO : Use public network key in keyring file to validate requests
  authenticationKey: null,
}
let redisClient = null
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
      .option('network', {
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
      // eslint-disable-next-line prefer-destructuring
    argv = program.argv
  }
  conf.port = select('port', argv, opts, conf)
  conf.network = select('network', argv, opts, conf)
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
  let password = null
  let keys = null
  let discoveryKey = null

  channel = createChannel({ })
  redisClient = redis.createClient()

  redisClient.on('connect', () => {
    info('Redis client connected')
  })

  redisClient.on('error', (err) => {
    info(`Something went wrong ${err}`)
  })

  await context.ready()

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
    conf.password = password
  }

  if (0 !== conf.identity.indexOf('did:ara:')) {
    conf.identity = `did:ara:${conf.identity}`
  }

  if (-1 !== conf.keyring.indexOf('.pub')) {
    warn(`Using keyring: ${conf.keyring}, which may not be a secret keyring.`)
    keys = await getClientAuthKey(conf)
  } else {
    keys = await getServerAuthKey(conf)
  }
  // eslint-disable-next-line prefer-destructuring
  discoveryKey = keys.discoveryKey
  // eslint-disable-next-line prefer-destructuring
  conf.authenticationKey = keys.authenticationKey

  debug('%s: discovery key:', pkg.name, discoveryKey.toString('hex'))
  debug('%s: authentication key:', pkg.name, conf.authenticationKey)

  // Server
  app = express()

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', domain)
    res.header('Access-Control-Allow-Headers', 'Authentication, Content-Type')
    next()
  })

  app.use(bodyParser.urlencoded({ extended: true }))

  app.post(`${appRoute}/`, authenticate, oncreate)
  app.get(`${appRoute}/:did`, authenticate, onresolve)
  app.get(`${appRoute}/:did/balance`, authenticate, onbalance)
  app.post(`${appRoute}/:did/transfer`, authenticate, ontransfer)
  app.post(`${appRoute}/:did/redeem`, onredeem)

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

  debug('Creating an _http_ server.')
  server = http.createServer(app)

  server.listen(conf.port, onlisten)
  server.once('error', (err) => {
    if (err && 'EADDRINUSE' === err.code) { server.listen(0, onlisten) }
  })

  return true

  async function authenticate(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    info('%s: Received request from', pkg.name, ip)
    if (undefined === req.headers.authentication || conf.authenticationKey !== req.headers.authentication) {
      res
        .status(status.authenticationError)
        .send(msg.authenticationFailed)
        .end()
    } else {
      return next()
    }
    return true
  }

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

    try {
      if (undefined === req.body.passphrase) {
        res
          .status(status.badRequest)
          .send('Missing Passphrase parameter.\n')
          .end()
        clearTimeout(timer)
      } else if ('' === req.body.passphrase) {
        res
          .status(status.badRequest)
          .send('Missing Passphrase parameter value.\n')
          .end()
        clearTimeout(timer)
      } else {
        res.status(status.ok)
        info('%s: Received create request', pkg.name)
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
    const now = Date.now()

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
        const did = new DID(req.params.did)
        const publicKey = Buffer.from(did.identifier, 'hex')
        const hash = crypto.blake2b(publicKey).toString('hex')
        const path = resolve(conf.path, hash, 'ddo.json')
        const ddo = JSON.parse(await pify(readFile)(path, 'utf8'))
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

  async function onbalance(req, res) {
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
      info('%s: Balance request for %s', pkg.name, req.params.did)
      const { did } = req.params
      let balance = null
      redisClient.get(did, async (err, bal) => {
        if (null == bal) {
          debug('Balance expired, retrieving from blockchain')
          balance = await token.balanceOf(did)
          redisClient.set(did, balance, 'EX', 60, (err, res) => {
            if (err) {
              debug(err)
            } else {
              debug(res)
            }
          })
        } else {
          balance = bal
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ balance }))
        res.on('finish', () => { clearTimeout(timer) })
        debug('%s: Balance request completed successfully.', pkg.name)
      })
    } catch (err) {
      debug(err)
      res
        .status(status.internalServerError)
        .send('Balance request failed. \n')
        .end()
      debug(err)
      clearTimeout(timer)
    }
  }

  async function ontransfer(req, res) {
    const now = new Date()

    try {
      if (0 !== req.params.did.indexOf('did:ara:')) {
        req.params.did = `did:ara:${req.query.did}`
      }
      // Check Balance before processing Transfer request

      info('%s: Transfer request for', pkg.name, req.params.did)
      const recipient = req.params.did
      const tokens = req.body.tokens || DEFAULT_TOKEN_COUNT
      const balance = await token.balanceOf(req.params.did)
      if ((parseInt(balance, 10) + parseInt(tokens, 10)) > MAX_TOKEN_PER_ACCOUNT) {
        res.status(status.ok)
        res.end(`Cannot transfer tokens. Only ${MAX_TOKEN_PER_ACCOUNT} allowed per user`)
      } else {
        token.transfer({
          did: process.env.DID,
          password: process.env.pwd,
          to: recipient,
          val: tokens
        }).then((data) => {
          info(JSON.stringify(data))
        })

        res.status(status.ok)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          created_at: now,
          did: recipient,
          tokens_requested: tokens
        }))
        info('%s: Transfer request submitted successfully.', pkg.name)
      }
    } catch (err) {
      warn(err)
      res
        .status(status.internalServerError)
        .send('Transfer request failed. \n')
        .end()
      debug(err)
    }
  }

  async function onredeem(req, res) {
    const timer = setTimeout(() => {
      res
        .status(status.requestTimeout)
        .send(msg.requestTimeout)
    }, REQUEST_TIMEOUT)

    try {
      if (undefined === req.headers.authentication || conf.authenticationKey !== req.headers.authentication) {
        res
          .status(status.authenticationError)
          .send(msg.authenticationFailed)
          .end()
        clearTimeout(timer)
      } else {
        if (0 !== req.params.did.indexOf('did:ara:')) {
          req.params.did = `did:ara:${req.query.did}`
        }
        res.status(status.ok)
        info('%s: Transfer request for', req.params.did)
        const recipient = 'did:ara:89b83d3deab9507889710bb5dbaf5e863435c05193dcb128f6488e0bd42a492b'
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
      }
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

  function onlisten() {
    const { port } = server.address()
    info('identity-manager: Server listening on port %s', port)
    announce()
  }

  function announce() {
    const { port } = server.address()
    debug('identity-manager: Announcing %s on port %s', discoveryKey.toString('hex'), port)
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
