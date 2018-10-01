const domain = 'http://34.238.159.205:8000'
const appRoute = '1.0/identifiers'
const authToken = 'f59419e36722ae9bc5f115fe1111776451cd87cfdfcfe7962192819ed917a6254bbf0d5ff596b70441152ec189beb27902332ade4bb48f4e7f90208c1eec2239'

function prettyPrint(stringifiedJSON) {
  let response
  try {
    response = JSON.parse(stringifiedJSON)
  } catch (e) {
    response = { Message: stringifiedJSON }
  }

  return JSON.stringify(response, null, 2)
}

const createSubmit = document.getElementById('createSubmit')

const createForm = document.getElementById('post')
createForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const passphrase = document.getElementById('passphrase').value

  const request = new XMLHttpRequest()
  const url = `${domain}/${appRoute}/`
  request.open('POST', url)
  request.setRequestHeader('Authentication', authToken)
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
  request.setRequestHeader('authentication', authToken)

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
