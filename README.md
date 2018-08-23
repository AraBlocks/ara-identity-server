<img src="https://github.com/arablocks/ara-module-template/blob/master/ara.png" width="30" height="30" /> ara-network-node-identity-manager
========

[![Build Status](https://travis-ci.com/AraBlocks/ara-network-node-identity-manager.svg?token=6WjTyCg41y8MBmCzro5x&branch=master)](https://travis-ci.com/AraBlocks/ara-network-node-identity-manager)

A cryptographic key management system which exposes a http api to create Ara identities.



## Status
**WIP**

> **Important**: Important oddities and common gotchas.

## Dependencies
- [Node](https://nodejs.org/en/download/)

## Installation
```sh
$ npm install ara-network ara-network-node-identity-manager
```

## Usage
```
$ ann -t . -i DID -s secret -k ~/.ara/keyring -n name -p 8000
```

## Example

```
$ DEBUG=express* ann -t . -i did:ara:3dcd040d936f78a35d5ae905001282444a32511718a87c70069624f70d87d994 -s asdf -k ~/.ara/keyring -n resolver -p 8877
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

### `create`
```
$ curl -i -X POST "http://localhost:8877/api/v1/create?passphrase=asdf"
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json
Date: Thu, 23 Aug 2018 19:53:38 GMT
Connection: keep-alive
Content-Length: 1244

{"did":"did:ara:eda61c894b4ebf1435d54f09a9ffcb156d7d8b98add588e2a2b508a9d15cab35","mnemonic":"fancy rate bullet turn then style that shoe clump sphere decrease garden","ddo":{"@context":"https://w3id.org/did/v1","id":"did:ara:eda61c894b4ebf1435d54f09a9ffcb156d7d8b98add588e2a2b508a9d15cab35","publicKey":[{"id":"did:ara:eda61c894b4ebf1435d54f09a9ffcb156d7d8b98add588e2a2b508a9d15cab35#owner","type":"Ed25519VerificationKey2018","owner":"did:ara:eda61c894b4ebf1435d54f09a9ffcb156d7d8b98add588e2a2b508a9d15cab35","publicKeyHex":"eda61c894b4ebf1435d54f09a9ffcb156d7d8b98add588e2a2b508a9d15cab35","publicKeyBase58":"GzgXz2xQx7YPEC9MenWhjM6anuMm6XiwL18HDeNKrnSG","publicKeyBase64":"O2mHIlLTr8UNdVPCan/yxVtfYuYrdWI4qK1CKnRXKs1"}],"authentication":[],"service":[],"created":"2018-08-23T19:53:38.845Z","updated":"2018-08-23T19:53:38.845Z","proof":{"type":"Ed25519VerificationKey2018","nonce":"1db5e5aaf227ee6e4a05a5322091eafb7339a3d37d99c84caec42bc3fbddd6f8","domain":"ara","created":"2018-08-23T19:53:38.846Z","creator":"did:ara:eda61c894b4ebf1435d54f09a9ffcb156d7d8b98add588e2a2b508a9d15cab35#owner","signatureValue":"015511d9b57e8285f11b734fb4e16364a349dfc92b5a6f108df478b8dead5b0012da98ffc587acc0504dd8207ab552df060a5f4b4f3b2f87d62912057c9dfe07"}}}
```

### `resolve`
```
 $ curl -i -X GET "http://localhost:8877/api/v1/resolve?did=did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265"
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json
Date: Thu, 23 Aug 2018 20:26:00 GMT
Connection: keep-alive
Content-Length: 1069

{"@context":"https://w3id.org/did/v1","id":"did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265","publicKey":[{"id":"did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265#owner","type":"Ed25519VerificationKey2018","owner":"did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265","publicKeyHex":"f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265","publicKeyBase58":"HbGQRRvepSHVGG1CKJwAoZUdHUa1wJdEMS1k9Cp2Q6kk","publicKeyBase64":"PaCJ81oUieUlCp4Y1NiIj8nRDNALK9n5kdr7GYJBgJl"}],"authentication":[],"service":[],"created":"2018-08-23T19:57:12.073Z","updated":"2018-08-23T19:57:12.073Z","proof":{"type":"Ed25519VerificationKey2018","nonce":"c56aaa700a99a9c5f7f830407c8de0228563323b773114070c2953f28bc36090","domain":"ara","created":"2018-08-23T19:57:12.076Z","creator":"did:ara:f68227cd68522794942a78635362223f274433402caf67e6476bec6609060265#owner","signatureValue":"d4c66e5c098e69abe8eee6d978ddd0c09837afa0471dc95da13a551415ea2c064464263061339422ac3e94ba132a55a35941d1be8ee8c6157283434e192ac80e"}}
```

## API

* [reponame.doStuff(arg1, arg2)](#doStuff)

### `reponame.doStuff(arg1, arg2)` <a name="doStuff"></a>

Lorem Ipsum dostuff
- `arg1`: description
- `arg2`: description

```js
const bytes = reponame.doStuff(32, 'ara-docs')
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
