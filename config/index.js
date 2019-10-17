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
  MAX_TOKEN_PER_ACCOUNT: 500,
  DEFAULT_TOKEN_COUNT: 100,
  TRANSFER_TIMEOUT: 90000,
  REQUEST_TIMEOUT: 5000
}

module.exports = {
  serverValues,
  status,
  msg
}
