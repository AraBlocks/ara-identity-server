const { redisInfo } = require('../config')
const { info } = require('ara-console')
const redis = require('redis')

const { host } = redisInfo

const redisClient = redis.createClient(host)

redisClient.on('connect', () => {
  info('Redis client connected')
})

redisClient.on('error', (err) => {
  info(`Something went wrong ${err}`)
})

module.exports = redisClient
