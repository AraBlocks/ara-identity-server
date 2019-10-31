const { redisInfo } = require('../config')
const { info } = require('ara-console')
const redis = require('redis')

const { host, port } = redisInfo

const redisClient = redis.createClient(port, host)

redisClient.on('connect', () => {
  info(`Redis client connected to ${host} on port ${port}`)
})

redisClient.on('error', (err) => {
  info(`Something went wrong ${err}`)
})

module.exports = redisClient
