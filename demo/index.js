const createSubmit = document.getElementById('createSubmit')

const createForm = document.getElementById('post')
createForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const passphrase = document.getElementById('passphrase').value

  const request = new XMLHttpRequest()
  const url = `http://localhost:8000/1.0/identifiers/?passphrase=${passphrase}`
  request.open('POST', url)

  request.onload = () => {
    // console.log('loaded ____ ::', request.responseText)
    const response = document.createElement('pre')
    response.innerText = request.responseText
    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(response)
    document.getElementById('passphrase').value = ''
    console.log('passphrase.value ____ ::', passphrase.value)
  }

  request.onerror = (err) => {
    console.log('error ____ ::', err)
  }

  request.send()
})

const resolveForm = document.getElementById('get')
resolveForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const did = document.getElementById('did').value

  const request = new XMLHttpRequest()
  const url = `http://localhost:8000/1.0/identifiers/?did=${did}`
  // const url = 'http://52.207.154.113:8888/1.0/identifiers/?did=did:ara:5d7a3cca23e9f2ac8a036a00bc57def5aa303e3f6666286cefef6f008730b6a9'
  request.open('GET', url)

  request.onload = () => {
    // console.log('loaded ____ ::', request.responseText)
    const response = document.createElement('pre')
    response.innerText = request.responseText
    const responseContainer = document.getElementById('responses')
    responseContainer.prepend(response)
    document.getElementById('did').value = ''
  }

  request.onerror = (err) => {
    console.log('error ____ ::', err)
  }

  request.send()
})