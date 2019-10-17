const { info } = require('ara-console')
const redis = require('redis')

const redisClient = redis.createClient()

redisClient.on('connect', () => {
  info('Redis client connected')
})

redisClient.on('error', (err) => {
  info(`Something went wrong ${err}`)
})

module.exports = redisClient
