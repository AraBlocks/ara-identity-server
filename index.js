/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-warning-comments */
const { getClientAuthKey, getServerAuthKey } = require('./util')
const { readFile } = require('fs')
const { info, warn } = require('ara-console')
const { parse: parseDID } = require('did-uri')
const { createChannel } = require('ara-network/discovery/channel')
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
const rc = require('./config/rc')()

const {
  ontransfer,
  onbalance,
  onresolve,
  oncreate,
  onredeem
} = require('./routes')

// in milliseconds
const REQUEST_TIMEOUT = 5000

//const DEFAULT_GAS_PRICE =
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

  app.get('/_hc', onstatus)

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
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    info('%s: Status ping received from %s', pkg.name, ip)
    res
      .status(status.ok)
      .end()
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
