const { privateAPI, serverValues, masterDID } = require('../config')
const { getGasPrice } = require('./getGasPrice')
const { info } = require('ara-console')
const redisClient = require('../services/redis.js')
const { token } = require('ara-contracts')
const { web3 } = require('ara-util')
const request = require('superagent')
const debug = require('debug')('ara:network:node:identity-manager:getGasPrice')
const Queue = require('bull')

const {
  basePath,
  apiKey,
  appToken
} = privateAPI

const {
  did,
  password
} = masterDID

const {
  TRANSFER_TIMEOUT
} = serverValues

const transferQueue = new Queue('Ara Transfer')

transferQueue.process(job => new Promise(async (resolve, reject) => {
  try {
    const { to, val } = job.data

    const { average, fast } = await getGasPrice()
    info('Current Average Gas Price : ', average)

    let txHash = null
    let timer = null

    // eslint-disable-next-line no-inner-declarations
    function onhash(hash) {
      txHash = hash
      info('Transaction Hash : ', txHash)
      timer = setTimeout(ontimeout, TRANSFER_TIMEOUT)
    }

    // eslint-disable-next-line no-inner-declarations
    async function onmined() {
      clearTimeout(timer)
      const receipt = await web3.tx.getTransactionReceipt(txHash)

      debug(receipt)
      info('Transfer Request completed successfully for', txHash)

      // Get Updated Balance from the Blockchain
      const balance = await token.balanceOf(to)
      await redisClient.set(to, balance, 'EX', 60, (err, value) => {
        if (err) {
          debug(err)
        } else {
          debug(value)
          debug(`Balance updated for ${to} to ${balance}`)
        }
      })

      // Update Balance to Rails Backend
      await request
        .post(`${basePath}/ara_identities/callback`)
        .send({ did: to, balance })
        .set('X-Apikey', apiKey)
        .set('X-AppToken', appToken)
        .set('Accept', 'application/json')
        .then((res) => {
          if (200 === res.status) {
            info(`Balance Updated in Rails Backend for ${to}`)
          }
        })
        .catch((err) => {
          debug(err)
        })

      resolve()
    }

    // eslint-disable-next-line no-inner-declarations
    async function ontimeout() {

      info('Transfer Request timed out, Checking previous transaction status....')
      const { status } = await web3.tx.getTransactionReceipt(txHash)

      if (status) {
        resolve()
      } else {
        info('Submitting replacement transaction on a higher Gas Price')
        token.transfer({
          did,
          password,
          to,
          val,
          gasPrice: fast / 10,
          onhash,
          onmined
        })
      }
    }
    // Submit Transfer Request to Blockchain
    token.transfer({
      did,
      password,
      to,
      val,
      gasPrice: average / 10,
      onhash,
      onmined
    })
  } catch (err) {
    debug(err)
    reject(err)
  }
}))
