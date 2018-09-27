function prettyPrint(stringifiedJSON) {
  const response = JSON.parse(stringifiedJSON)
  return JSON.stringify(response, null, 2)
}

const createSubmit = document.getElementById('createSubmit')

const createForm = document.getElementById('post')
createForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const passphrase = document.getElementById('passphrase').value

  const request = new XMLHttpRequest()
  const url = `http://34.238.159.205:8000/1.0/identifiers/?passphrase=${passphrase}`
  request.open('POST', url)

  request.onload = () => {
    const response = document.createElement('pre')
    response.innerText = request.responseText

    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(prettyPrint(response))

    document.getElementById('passphrase').value = ''
    console.log('passphrase.value ____ ::', passphrase.value)
  }

  request.onerror = (err) => {
    const error = JSON.stringify({ Error: err })
    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(prettyPrint(error))
    console.log('error ____ ::', err)
  }

  request.send()
})

const resolveForm = document.getElementById('get')
resolveForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const did = document.getElementById('did').value

  const request = new XMLHttpRequest()
  const url = `http://34.238.159.205:8000/1.0/identifiers/?did=${did}`
  request.open('GET', url)

  request.onload = () => {
    const response = document.createElement('pre')
    response.innerText = request.responseText

    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(prettyPrint(response))

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