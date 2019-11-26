const { privateAPI, serverValues, masterDID } = require('../config')
const { getGasPrice } = require('./getGasPrice')
const { info, warn } = require('ara-console')
const redisClient = require('../services/redis.js')
const { token } = require('ara-contracts')
const { web3 } = require('ara-util')
const request = require('superagent')
const debug = require('debug')('ara:network:node:identity-manager:getGasPrice')
const queue = require('bull')

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

let transferQueue = new queue('Ara Transfer', 'redis://127.0.0.1:6379')

transferQueue.process((job) => {

  return new Promise(async (resolve, reject) => {
    try {
      let { to, val } = job.data

      let { average, fast } = await getGasPrice()
      info("Current Average Gas Price : ", average)

      let txHash = null
      let timer = null

      function onhash(hash) {
        txHash = hash
        info("Transaction Hash : ", txHash)
        timer = setTimeout(ontimeout, TRANSFER_TIMEOUT)
      }

      async function onmined() {
        clearTimeout(timer)
        const receipt = await web3.tx.getTransactionReceipt(txHash)

        debug(receipt)
        info('Transfer Request completed successfully for ', txHash)

        // Get Updated Balance from the Blockchain
        let balance = await token.balanceOf(to)
        await redisClient.set(to, balance, 'EX', 60, (err, val) => {
          if (err) {
            debug(err)
          } else {
            debug(`Balance updated for ${to}`)
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

      function ontimeout() {
        info('Transfer Request timed out....Submitting on a higher Gas Price')
        token.transfer({
          did,
          password,
          to,
          val,
          gasPrice: fast/10,
          onhash,
          onmined
        })
      }
      // Submit Transfer Request to Blockchain
      token.transfer({
        did,
        password,
        to,
        val,
        gasPrice: average/10,
        onhash,
        onmined
      })
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
})
