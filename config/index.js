
/*
Set ENV variable
 */

let env = process.env.ENV

if (process.env.ENV) {
 env = process.env.ENV
} else {
   try {
     env = fs.readFileSync(path.resolve(__dirname, 'env')).toString().trim() || env
   } catch (e) {
     env = 'production'
   }
}

/*
Redis Host
 */
const redisInfo = {}

redisInfo.host = 'production' === env ?
  'ls-ara-rewards-api.pruul5.ng.0001.use1.cache.amazonaws.com':
  '127.0.0.1'

redisInfo.port = 6379

/*
Set Littlstar Private API credentials
 */

const privateAPI = {}

privateAPI.basePath = 'production' === env ?
  'https://littlstar.com/api/private':
  'https://staging.littlstar.com/api/private'

privateAPI.apiKey = 'production' === env ?
  'ea60d365bef27b80a2f2fc019c3c1eaa0a38682d8e361ce935ad9a0f':
  'f48dcf7e21b23d1146f48b409ee470b4120661a5fb9c373dc1174fd6'

privateAPI.appToken = 'production' === env ?
  '35d7df6f-fdd7-410f-82ed-5355d3729a1d':
  '0b0e786c-ce0e-4367-9863-570284a4aae4'

/*
Status Variables
 */

const status = {
  internalServerError: 500,
  requestTimeout: 408,
  notImplemented: 501,
  badRequest: 400,
  notFound: 404,
  ok: 200,
  authenticationError: 401
}

/*
 Response Messages
  */

const msg = {
  requestTimeout: 'Request timed out.\n',
  authenticationFailed: 'Missing or invalid authentication credentials. \n',
  status: 'Ara Identity Manager up and running. \n'
}

/*
Constant Values
 */

const serverValues = {
  MAX_TOKEN_PER_ACCOUNT: 100,
  DEFAULT_TOKEN_COUNT: 100,
  TRANSFER_TIMEOUT: 180000,
  REQUEST_TIMEOUT: 5000
}

/*
Eth Gas Station API URL
 */

const gasAPI = "https://ethgasstation.info/json/ethgasAPI.json"

/*
Master ARA Wallet info
 */

const masterDID = {
  did: process.env.DID,
  password: process.env.pwd
}

module.exports = {
  serverValues,
  privateAPI,
  masterDID,
  redisInfo,
  gasAPI,
  status,
  msg
}
