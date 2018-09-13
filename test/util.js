const { getClientAuthKey, getServerAuthKey } = require('../util')
const test = require('ava')

const clientOpts = {
  network: 'archiver',
  keyring: `${__dirname}/fixtures/keyring.pub`,
  secret: 'secret'
}

const serverOpts = {
  identity: 'did:ara:bfcfd4e2de84784b7d17befa561e8a448b4f502f950275b315cefa8fe9cf2e09',
  network: 'archiver',
  path: `${__dirname}/fixtures/identities`,
  keyring: `${__dirname}/fixtures/keyring`,
  password: 'c',
  secret: 'secret'
}

// Get Authentication Key
test('util - derive authenticationKey', async (t) => {
  try {
    const { authenticationKey: clientKey } = await getClientAuthKey(clientOpts)
    const { authenticationKey: serverKey } = await getServerAuthKey(serverOpts)
    t.true(clientKey === serverKey)
  } catch (err) {
    throw new Error(err)
  }
})
