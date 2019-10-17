'use strict'
const { info, warn } = require('ara-console')
const redis = require('redis')

let redisClient = redis.createClient()

redisClient.on('connect', () => {
  info('Redis client connected')
})

redisClient.on('error', (err) => {
  info(`Something went wrong ${err}`)
})

module.exports = redisClient
