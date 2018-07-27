const debug = require('debug')('ara:network:node:identity-manager')
const { createChannel } = require('ara-network/discovery/channel')
const { createServer } = require('ara-network/discovery')
const { info, warn, error } = require('ara-console')
const secrets = require('ara-network/secrets')
const context = require('ara-context')()
const aid = require('ara-identity')
const { resolve } = require('path')
const express = require('express')
const extend = require('extend')
const http = require('http')


// in milliseconds
const kRequestTimeout = 5000

const conf = {
  // in milliseconds
  'dns-announce-interval': 1000 * 60 * 2,
  // in milliseconds
  'dht-announce-interval': 1000 * 60 * 2,
  archiverKey: null,
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
      .option('port', {
        type: 'number',
        alias: 'p',
        describe: 'Port for network server to listen on.',
        default: conf.port
      })
      .option('key', {
        type: 'string',
        alias: 'k',
        describe: 'Network key string',
      })
      .option('archiverKey', {
        type: 'string',
        alias: 'K',
        describe: 'Archiver Network key string',
      })


    extend(true, conf, argv)
  }

  return extend(true, conf, opts)
}

async function start(argv) {

  const keys = {
    discoveryKey: null,
    remote: null,
    client: null,
    network: null,
  }

  if (null === conf.key || 'string' !== typeof conf.key) {
    throw new TypeError('Expecting manager network key to be a string.')
  }

  if (null === conf.archiverKey || 'string' !== typeof conf.archiverKey) {
    throw new TypeError('Expecting archiver network key to be a string.')
  }

  try {
    const doc = await secrets.load(conf)
    const { keystore } = doc.public || doc.secret
    Object.assign(keys, secrets.decrypt({ keystore }, { key: conf.key }))
  } catch (err) {
    debug(err)
    throw new Error(`Unable to read keystore for '${conf.key}'.`)
  }

  Object.assign(conf, { discoveryKey: keys.discoveryKey })
  Object.assign(conf, {
    network: keys.network,
    client: keys.client,
    remote: keys.remote,
  })

  app = express()

  app.post('/api/v1/create/', onidentifier)

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

  async function onidentifier(req, res) {
    try{
      if (undefined === req.query.passphrase) {
        res.status(401).send("Missing Passphrase").end()
      }
      else {
        const password = req.query.passphrase
        const identifier = await aid.create({ context, password })
        const doc = await secrets.load({key: conf.archiverKey})
        const { keystore } = (doc.public || doc.secret)
        await aid.archive(identifier,{key: conf.archiverKey, keystore})
        const response = {
          ddo: identifier.ddo
        }
        console.log(response)
        res.end(JSON.stringify(response))
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
    info('identity-manager: Announcing %s on port %s', conf.discoveryKey.toString('hex'), port)
    channel.join(conf.discoveryKey, port)
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
