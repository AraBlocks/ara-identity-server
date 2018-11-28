/* eslint-disable no-undef */
/* eslint-disable no-console */

const domain = 'http://34.238.159.205:8000'
const appRoute = '1.0/identifiers'
const { getClientAuthKey } = require('ara-identity-server/util')

const { authenticationKey } = getClientAuthKey({
      identity: 'e67f213c57a8178ea46d166af9429aee8c1ce44f072c42ab5ad9c49fa7c65031',
      password: 'manager'
      secret: 'identity-manager',
      network: 'manager',
      keyring: '/home/ubuntu/.ara/keyrings/ara-manager',
    })

function prettyPrint(stringifiedJSON) {
  let response
  try {
    response = JSON.parse(stringifiedJSON)
  } catch (e) {
    response = { Message: stringifiedJSON }
  }

  return JSON.stringify(response, null, 2)
}

const createForm = document.getElementById('post')
createForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const passphrase = document.getElementById('passphrase').value

  const request = new XMLHttpRequest()
  const url = `${domain}/${appRoute}/`
  request.open('POST', url)
  request.setRequestHeader('Authentication', authenticationKey)
  request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')

  request.onload = () => {
    const response = document.createElement('pre')
    response.innerText = prettyPrint(request.responseText)

    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(response)

    document.getElementById('passphrase').value = ''
  }

  request.onerror = (err) => {
    const error = JSON.stringify({ Error: err })
    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(prettyPrint(error))
    console.log('error ____ ::', err)
  }

  request.send(`passphrase=${passphrase}`)
})

const resolveForm = document.getElementById('get')
resolveForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const did = document.getElementById('did').value

  const request = new XMLHttpRequest()
  const url = `${domain}/${appRoute}/?did=${did}`
  request.open('GET', url)
  request.setRequestHeader('authentication', authenticationKey)

  request.onload = () => {
    const response = document.createElement('pre')
    response.innerText = prettyPrint(request.responseText)

    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(response)

    document.getElementById('did').value = ''
  }

  request.onerror = (err) => {
    const error = JSON.stringify({ Error: err })
    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(prettyPrint(error))
    console.log('error ____ ::', err)
  }

  request.send()
})
