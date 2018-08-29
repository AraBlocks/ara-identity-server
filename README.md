<img src="https://github.com/arablocks/ara-module-template/blob/master/ara.png" width="30" height="30" /> ara-network-node-identity-manager
========

[![Build Status](https://travis-ci.com/AraBlocks/ara-network-node-identity-manager.svg?token=6WjTyCg41y8MBmCzro5x&branch=master)](https://travis-ci.com/AraBlocks/ara-network-node-identity-manager)

A cryptographic key management system which exposes a http api to create Ara identities.

## Status
**WIP**

## Dependencies
- [Node](https://nodejs.org/en/download/)

## Installation
```sh
$ npm install ara-network ara-network-node-identity-manager
```

> **Important**: Ensure ara-network is linked:
```sh
$ cd ~/ara-network-node-identity-manager && npm link
$ cd ~/ara-network && npm link ara-network-node-identity-manager
```
or run all commands in `~/ara-network-node-identity-manager` directory.

## Usage
Use [ann](https://github.com/arablocks/ara-network) to spin up an express server with the following options:
```
usage: ann -t ara-network-node-identity-manager [options]

Options:
  --debug, -D     Enable debug output                                  [boolean]
  --conf, -C      Path to configuration file                            [string]
  --help, -h      Show help                                            [boolean]
  --identity, -i  Ara Identity for the network node          [string] [required]
  --secret, -s    Shared secret key                                     [string]
  --name, -n      Human readable network keys name.          [string] [required]
  --keyring, -k   Path to ARA network keys                   [string] [required]
  --port, -p      Port for network node to listen on.                   [number]
  --sslKey, -K    Path to ssl key file for the server                   [string]
  --sslCert, -C   Path to ssl certificate file for the server           [string]
```

Create an http server:
```
$ ann -t . -i DID -k ~/.ara/keyring -n name
```

Create an https server:
```
$ ann -t . -i DID -k ~/.ara/keyring -n name -C example-cert.pem -K example-key.pem
```

Specify port and shared secret key:
```
$ ann -t . -i DID -k ~/.ara/keyring -n name -s sharedsecret -p 1337
```

## Example

```
$ DEBUG=express* ann -t . -i did:ara:3dcd040d936f78a35d5ae905001282444a32511718a87c70069624f70d87d994 -k ~/.ara/keyring -n resolver -p 8877
 ara: info:  Configuring network node '.'.
 ara: info:  Starting network node '.'
? Please enter the passphrase associated with the node identity.
Passphrase: [hidden]
 ara: info:  ara-network-node-identity-manager: discovery key: 66d83aa5f9ec2eb722bd7eb41c609deea92040324f9643b5a2b9936a026e441e
  express:application set "x-powered-by" to true +0ms
  express:application set "etag" to 'weak' +2ms
  express:application set "etag fn" to [Function: generateETag] +0ms
  express:application set "env" to 'development' +0ms
  express:application set "query parser" to 'extended' +0ms
  express:application set "query parser fn" to [Function: parseExtendedQueryString] +0ms
  express:application set "subdomain offset" to 2 +1ms
  express:application set "trust proxy" to false +0ms
  express:application set "trust proxy fn" to [Function: trustNone] +0ms
  express:application booting in development mode +0ms
  express:application set "view" to [Function: View] +0ms
  express:application set "views" to '/Users/vipyne/Documents/littlstar/ara/ara-network-node-identity-manager/views' +0ms
  express:application set "jsonp callback name" to 'callback' +0ms
  express:router use '/' query +1ms
  express:router:layer new '/' +0ms
  express:router use '/' expressInit +0ms
  express:router:layer new '/' +0ms
  express:router:route new '/api/v1/create' +1ms
  express:router:layer new '/api/v1/create' +0ms
  express:router:route post '/api/v1/create' +0ms
  express:router:layer new '/' +0ms
  express:router:route new '/api/v1/resolve' +0ms
  express:router:layer new '/api/v1/resolve' +0ms
  express:router:route get '/api/v1/resolve' +0ms
  express:router:layer new '/' +0ms
 ara: info:  identity-manager: Server listening on port 8877
 ara: info:  identity-manager: Announcing 66d83aa5f9ec2eb722bd7eb41c609deea92040324f9643b5a2b9936a026e441e on port 8877

```

## API

* [create](#create)
* [resolve](#resolve)

### `create ? passphrase` <a name="create"></a>

Accepts a passphrase then creates and returns a DID.
- `passphrase`: A new passphrase

Returns an object:
- `did`: 'did:ara:abc123...'
- `mnemonic`: 'word some thing else ...'

> **Important**: Store the mnemonic in a safe, analog place; it is the only recovery mechanism for the Ara ID.
> **Important**: Not sure if the above is true in this situation, maybe just the passphrase is nec.

```
$ curl -i -X POST "http://localhost:8877/api/v1/create?passphrase=asdf"

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json
Date: Thu, 23 Aug 2018 19:53:38 GMT
Connection: keep-alive
Content-Length: 177

{
  "mnemonic" : "pupil quit wisdom lyrics local expire genius analyst ridge flight famous convince",
  "did" : "did:ara:b7d2cb39d06f8a53716844f24ec059371ecef6d6b6cd514c9d5d8209a46b8b23"
}

```

### `resolve ? did` <a name="resolve"></a>

Accepts a DID and returns the associated DDO.
- `did`: A did to resolve

Returns a DDO.

```
$ curl -i -X GET "http://localhost:8877/api/v1/resolve?did=did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265"

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json
Date: Thu, 23 Aug 2018 20:26:00 GMT
Connection: keep-alive
Content-Length: 1069

{
  "authentication" : [],
  "proof" : {
    "signatureValue" : "d4c66e5c098e69abe8eee6d978ddd0c09837afa0471dc95da13a551415ea2c064464263061339422ac3e94ba132a55a35941d1be8ee8c6157283434e192ac80e",
    "created" : "2018-08-23T19:57:12.076Z",
    "type" : "Ed25519VerificationKey2018",
    "domain" : "ara",
    "creator" : "did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265#owner",
    "nonce" : "c56aaa700a99a9c5f7f830407c8de0228563323b773114070c2953f28bc36090"
  },
  "created" : "2018-08-23T19:57:12.073Z",
  "@context" : "https://w3id.org/did/v1",
  "service" : [],
  "id" : "did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265",
  "updated" : "2018-08-23T19:57:12.073Z",
  "publicKey" : [
    {
      "publicKeyBase64" : "PaCJ81oUieUlCp4Y1NiIj8nRDNALK9n5kdr7GYJBgJl",
      "owner" : "did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265",
      "type" : "Ed25519VerificationKey2018",
      "id" : "did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265#owner",
      "publicKeyBase58" : "HbGQRRvepSHVGG1CKJwAoZUdHUa1wJdEMS1k9Cp2Q6kk",
      "publicKeyHex" : "f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265"
    }
  ]
}
```

## Contributing
- [Commit message format](/.github/COMMIT_FORMAT.md)
- [Commit message examples](/.github/COMMIT_FORMAT_EXAMPLES.md)
- [How to contribute](/.github/CONTRIBUTING.md)

Releases follow [Semantic Versioning](https://semver.org/)

## See Also
- External [link](https://goo.gl/67cqTC)s

## License
LGPL-3.0
