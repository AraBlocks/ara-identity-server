<img src="https://github.com/arablocks/ara-module-template/blob/master/ara.png" width="30" height="30" /> ara-identity-server
========

> **Important**: `mount.sh` must be removed from git history before making this repo public.

[![Build Status](https://travis-ci.com/AraBlocks/ara-network-node-identity-manager.svg?token=6WjTyCg41y8MBmCzro5x&branch=master)](https://travis-ci.com/AraBlocks/ara-network-node-identity-manager)

A cryptographic key management system which exposes a http api to create Ara identities.

## Status
**Stable**

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

## Authentication

* For now, the server uses an `authenticationKey` retrieved from the keyring file to validate incoming [create](#create) & [resolve](#resolver) requests
* It should be set in the request header as `authentication`
* The `authenticationKey` value can be retrieved using [`getClientAuthKey()`](https://github.com/AraBlocks/ara-identity-server/blob/master/util.js#L23) method in `util.js`
* Please refer to [ara-network](https://github.com/arablocks/ara-network) to learn more about keyrings

## API

* [create](#create)
* [resolve](#resolve)
* [status](#status-route)

### `create ? passphrase` <a name="create"></a>

Accepts a passphrase then creates and returns a DID.
- `passphrase`: A new passphrase

Returns an object:
- `did`: 'did:ara:abc123...'
- `mnemonic`: 'word some thing else ...'
- `ddo` : '{"@context": "",....}'
- `walletAddress` : '0x30ff0edf64a015e8d412ec9427415f2d23117078'

> **Important**: Store the mnemonic in a safe, analog place; it is the only recovery mechanism for an Ara ID.

```
$ curl -H 'authentication: <authenticationKey>' \
       -H 'Content-Type: application/x-www-form-urlencoded' \
       -i -X POST -d "passphrase=asdf" "http://localhost:8877/1.0/identifiers"

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json
Date: Thu, 23 Aug 2018 19:53:38 GMT
Connection: keep-alive
Content-Length: 177

{
  "mnemonic" : "pupil quit wisdom lyrics local expire genius analyst ridge flight famous convince",
  "did" : "did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265",
  "ddo" :
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
    },
  "walletAddress" : "0x30ff0edf64a015e8d412ec9427415f2d23117078"
}

```

### `resolve ? did` <a name="resolve"></a>

Accepts a DID and returns the associated DDO.
- `did`: A did to resolve

Returns a DDO.

The response format might be changed in the future to match the [did-resolution spec](https://w3c-ccg.github.io/did-resolution/)

```
$ curl -H "authentication: <authenticationKey>" \
       -i -X GET \
       "http://localhost:8877/1.0/identifiers/did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f"

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json
Date: Thu, 23 Aug 2018 20:26:00 GMT
Connection: keep-alive
Content-Length: 1069

{
  "didDocument": {
    "@context": "https://w3id.org/did/v1",
    "id": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f",
    "publicKey": [
      {
        "id": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f#owner",
        "type": "Ed25519VerificationKey2018",
        "owner": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f",
        "publicKeyHex": "ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f",
        "publicKeyBase58": "GvLUCv4cuLLZK9bBdrgDx5MsSv1AnYXho9W3mppFxbmx",
        "publicKeyBase64": "OyJGbsgm4HO+1qusTB1QRrfRoycUyNUdiypziaboA6P"
      },
      {
        "id": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f#eth",
        "type": "Secp256k1VerificationKey2018",
        "owner": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f",
        "publicKeyHex": "3a1e2cd7aea7d27c0b5971d840276328b4be8e2e7ded9ef00630d7b4ea897d165e099e4062d8b391edda2f02b203511e490729e3e411ab2f90f424d7cd725fd2",
        "publicKeyBase58": "2APqouovufGPLL7bPyZZPGqth2CxpG3zufz5uEGk1uLLNyyubGc57rR7Lnuxigxb7KAHSkAB1YN7dFrye3rwe2q7",
        "publicKeyBase64": "6HizXrqfSfAtZcdhAJ2MotL6OLn3tnvAGMNe06ol9Fl4JnkBi2LOR7dovArIDUR5JBynj5BGrL5D0JNfNcl/S"
      }
    ],
    "authentication": [
      {
        "publicKey": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f#owner",
        "type": "Ed25519SignatureAuthentication2018"
      },
      {
        "publicKey": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f#eth",
        "type": "Secp256k1SignatureAuthentication2018"
      }
    ],
    "service": [],
    "created": "2018-09-10T21:20:42.864Z",
    "updated": "2018-09-10T21:20:42.864Z",
    "proof": {
      "type": "Ed25519VerificationKey2018",
      "nonce": "5a6a1a3a5ed250ba31adbde5909f6c0b8d04a5572b4801c6edc635cfc839f9f8",
      "domain": "ara",
      "created": "2018-09-10T21:20:42.867Z",
      "creator": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f#owner",
      "signatureValue": "da0b371e3e0e1612132992f99e6025e0daa5b2a5425cdf66c7353b126076ef895ab80679b7d423b9a7c80e4c124bb74c8dda6fcca9011f78feec7b73ce355e04"
    }
  },
  "didReference": {
    "reference": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f",
    "did": "did:ara:ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f",
    "method": "ara",
    "identifier": "ec8919bb209b81cefb5aaeb13075411adf468c9c532354762ca9ce269ba00e8f",
    "path": "",
    "fragment": "",
    "query": ""
  },
  "methodMetadata": {},
  "resolverMetadata": {
    "retrieved": "2018-09-12T21:36:56.768Z",
    "duration": 0,
    "driverId": "did:ara",
    "driver": "HttpDriver"
  }
}
```

### `status` <a name="status-route"></a>

Emits back a message if the server is reachable and running

```
$ curl -i -X GET "http://localhost:8877/1.0/identifiers/status"

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 39
ETag: W/"27-Lt/602+OsqNBpoQXD3gIgR3WfhI"
Date: Tue, 11 Sep 2018 16:05:01 GMT
Connection: keep-alive

Ara Identity Manager up and running.
```

### `transfer` <a name="transfer-route"></a>

Transfers ARA tokens to the mentioned DID. Accepts DID and optional token paramenter. Default Tokens : 100
- `did`: User DID to which tokens need to be transferred
- `tokens` : No of Tokens that needs to be transferred (Optional) (Default Value : 100)

```
$ curl -H 'authentication: 4f2b0b9de037d2ed2e761637dc479414850fc693dc527f59a48dcb3c5ac84469f0dc53b0ad9ee8636d9c58fdf8daa97fab22286317ec95b7573cdd84597f952f' /
       -H 'Content-Type: application/x-www-form-urlencoded' /
       -i -X POST -d "tokens=<no_of_tokens>" "http://localhost:8600/1.0/identifiers/did:ara:785b9662245f689ec13cd3bf6ab7e8e2f32a7166e2b8485c29e12109b200229f/transfer"

  HTTP/1.1 200 OK
  X-Powered-By: Express
  Access-Control-Allow-Origin: http://mrmanager.ara.one
  Access-Control-Allow-Headers: Authentication, Content-Type
  Content-Type: application/json
  Date: Tue, 24 Sep 2019 17:49:07 GMT
  Connection: keep-alive
  Content-Length: 147

  {"created_at":"2019-09-24T17:49:07.618Z","did":"did:ara:785b9662245f689ec13cd3bf6ab7e8e2f32a7166e2b8485c29e12109b200229f","tokens_requested":"<no_of_tokens>"}%

```

### `balance` <a name="balance-route"></a>

Get the ARA Balance of a user wallet. Accepts DID
- `did`: DID of the Littlstar User

```
$ curl -H 'authentication: 4f2b0b9de037d2ed2e761637dc479414850fc693dc527f59a48dcb3c5ac84469f0dc53b0ad9ee8636d9c58fdf8daa97fab22286317ec95b7573cdd84597f952f' /
       -i -X GET "http://localhost:8600/1.0/identifiers/did:ara:785b9662245f689ec13cd3bf6ab7e8e2f32a7166e2b8485c29e12109b200229f/balance"

  HTTP/1.1 200 OK
  X-Powered-By: Express
  Access-Control-Allow-Origin: http://mrmanager.ara.one
  Access-Control-Allow-Headers: Authentication, Content-Type
  Content-Type: application/json
  Date: Tue, 24 Sep 2019 17:49:07 GMT
  Connection: keep-alive
  Content-Length: 147

  {"balance":"201"}

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
