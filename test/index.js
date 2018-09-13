const { getClientKey } = require('../util')
const manager = require('../')
const test = require('ava')
const request = require('superagent')

let authenticationKey

async function startManager() {
  try {
    await manager.configure({
      identity: 'did:ara:bfcfd4e2de84784b7d17befa561e8a448b4f502f950275b315cefa8fe9cf2e09',
      network: 'archiver',
      path: `${__dirname}/fixtures/identities`,
      keyring: `${__dirname}/fixtures/keyring`,
      password: 'c',
      secret: 'secret',
      port: 8888
    })
    await manager.start()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('error in setup:', err)
  }
}

// Note: timeouts to be addressed in integration tests

test.before(async () => {
  await startManager()
  const clientOpts = {
    network: 'archiver',
    keyring: `${__dirname}/fixtures/keyring.pub`,
    secret: 'secret'
  }
  const keys = await getClientKey(clientOpts)
  // eslint-disable-next-line prefer-destructuring
  authenticationKey = keys.authenticationKey
})

// Status
test('Create - passphrase', async t => request
  .get('http://localhost:8888/1.0/identifiers/status')
  .then((res) => {
    t.true(200 === res.status)
  }))

// Create
test('Create - passphrase', async t => request
  .post('http://localhost:8888/1.0/identifiers')
  .set('authentication', authenticationKey)
  .set('Content-Type', 'application/x-www-form-urlencoded')
  .send('passphrase=asdf')
  .then((res) => {
    t.true(200 === res.status)
  })
  .catch((res) => {
    // intentionally fail this check
    t.true('500' === res.status)
  }))

test('Create - no passphrase param', async t => request
  .post('http://localhost:8888/1.0/identifiers/')
  .set('authentication', authenticationKey)
  .set('Content-Type', 'application/x-www-form-urlencoded')
  .catch((res) => {
    t.true(400 === res.status)
  }))

test('Create - no passphrase value', async t => request
  .post('http://localhost:8888/1.0/identifiers/?passphrase=')
  .set('authentication', authenticationKey)
  .set('Content-Type', 'application/x-www-form-urlencoded')
  .send('passphrase=')
  .catch((res) => {
    t.true(400 === res.status)
  }))

// Resolve
test('Resolve - did', async t => request
  .get('http://localhost:8888/1.0/identifiers/?did=did:ara:bfcfd4e2de84784b7d17befa561e8a448b4f502f950275b315cefa8fe9cf2e09')
  .set('authentication', authenticationKey)
  .then((res) => {
    t.true(200 === res.status)
  }))

test('Resolve - no did param', async t => request
  .get('http://localhost:8888/1.0/identifiers/')
  .set('authentication', authenticationKey)
  .catch((res) => {
    t.true(400 === res.status)
  }))

test('Resolve - no did value', async t => request
  .get('http://localhost:8888/1.0/identifiers/?did=')
  .set('authentication', authenticationKey)
  .catch((res) => {
    t.true(400 === res.status)
  }))

// Update
test('Update post', async t => request
  .post('http://localhost:8888/1.0/identifiers/update')
  .catch((res) => {
    t.true(501 === res.status)
  }))

test('Update get', async t => request
  .get('http://localhost:8888/1.0/identifiers/update')
  .catch((res) => {
    t.true(501 === res.status)
  }))

// Delete
test('Delete post', async t => request
  .post('http://localhost:8888/1.0/identifiers/delete')
  .catch((res) => {
    t.true(501 === res.status)
  }))

test('Delete get', async t => request
  .get('http://localhost:8888/1.0/identifiers/delete')
  .catch((res) => {
    t.true(501 === res.status)
  }))

// Edge cases
test('nonsense route', async t => request
  .get('http://localhost:8888/1.0/identifiers/nonsense')
  .catch((res) => {
    t.true(404 === res.status)
  }))

test.after(() => {
  manager.stop()
})
