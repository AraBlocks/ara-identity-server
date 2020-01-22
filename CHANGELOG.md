## [1.0.4](https://github.com/AraBlocks/ara-identity-server/compare/0.1.0...1.0.4) (2020-01-22)


### Bug Fixes

* **config:** Fix redis config ([70becb8](https://github.com/AraBlocks/ara-identity-server/commit/70becb8b458599c5676cd0b4117789a01332a5cd))
* **index.js:** Fix check for MAX Tokens ([2dc9cc4](https://github.com/AraBlocks/ara-identity-server/commit/2dc9cc4983406ed64857b73d1ab8890dc7edbfd9))
* **index.js:** Fix linting issues ([199d0e4](https://github.com/AraBlocks/ara-identity-server/commit/199d0e4aadbe394d002f69fa6d135aa74449e23f))
* **index.js:** Set proper CORS headers SO @Prash74 ([43f8338](https://github.com/AraBlocks/ara-identity-server/commit/43f833881a820bf4362b4f71f98aee3f9350a501))
* **util:** Refactor resubmitting eth transfers ([e6c8f62](https://github.com/AraBlocks/ara-identity-server/commit/e6c8f62b7479ea133560c02f435b2942d7443f17))
* **util/submitTransaction:** Refactor transaction submission logic ([903e6e4](https://github.com/AraBlocks/ara-identity-server/commit/903e6e4622f904295d4c0cdb23c0b73b96a2fb2c))


### Features

* **/demo:** Add frontend demo files ([597cae2](https://github.com/AraBlocks/ara-identity-server/commit/597cae28048db0f4d2422e4ed8fd8809b746685c))
* **balance:** Refactor redis logic ([2fc30b8](https://github.com/AraBlocks/ara-identity-server/commit/2fc30b8f10473a962c39995f91fbbd33df42e0d3))
* **config:** Add Gas Station API URL ([c6c36e7](https://github.com/AraBlocks/ara-identity-server/commit/c6c36e71a9ba84eb71a1d2e111727db601cb5646))
* **config:** Add LS private API & ENV credentials ([a7ad324](https://github.com/AraBlocks/ara-identity-server/commit/a7ad324d8da56a735443ee4c71e17a128af23d28))
* **index.js:** Add CORS response headers for domain ([0360229](https://github.com/AraBlocks/ara-identity-server/commit/03602298bf8be30498d78c49c40cf71cf84f2fc2))
* **index.js:** Add wallet address to create route response ([e8866ef](https://github.com/AraBlocks/ara-identity-server/commit/e8866efcb7c8a0b2d48c0a094b91bfe470fed4f5))
* **index.js:** Allow default option for conf details ([92b92b4](https://github.com/AraBlocks/ara-identity-server/commit/92b92b48b4994b50bdd3bca0c842a4276e3cf7d3))
* **index.js:** First pass at Ara Rewards program ([00330ac](https://github.com/AraBlocks/ara-identity-server/commit/00330acb9d6cf4a2c0eabfe1781d0b86ace0cfde))
* **index.js:** Refactor routes with authentication ([4e9c55c](https://github.com/AraBlocks/ara-identity-server/commit/4e9c55c581b896c4d480e0d03173d5b23098ca8c))
* **index.js:** Refactor to make modularize routes ([5c1c405](https://github.com/AraBlocks/ara-identity-server/commit/5c1c405f68f384590778ab2015e94b2257a58a28))
* **index.js:** Return receipt for transfer request ([81622c9](https://github.com/AraBlocks/ara-identity-server/commit/81622c93edff56c45bf33536303b166422ba3b37))
* **index.js:** Update status route & debug transfer method ([90a55f7](https://github.com/AraBlocks/ara-identity-server/commit/90a55f704384e68928a0c77c3a697b21e05dae36))
* **package.json:** Update dependency versions ([b4a4a17](https://github.com/AraBlocks/ara-identity-server/commit/b4a4a1732eff413a04a6b1452f6e70edf22289cb))
* **redis:** Update redis to use external host in production ([c40d9e1](https://github.com/AraBlocks/ara-identity-server/commit/c40d9e19871fe96360788e4f6b3018e33baeb4f5))
* **resolve:** Promisify Redis calls ([66e3c82](https://github.com/AraBlocks/ara-identity-server/commit/66e3c82c8c8c37d9f2b63e9a74f7290f4809aad5))
* **resolve:** Use aid.resolve() to read remote Identities as well ([75b8cdb](https://github.com/AraBlocks/ara-identity-server/commit/75b8cdb42f830461c629236e89da1014759c5c8f))
* **routes:** Refactor code to have separate routes ([3662af0](https://github.com/AraBlocks/ara-identity-server/commit/3662af0a5324b294b12e62d7677e70ef01b7ab49))
* **transfer:** Add job queue login for submitting txns ([00b5904](https://github.com/AraBlocks/ara-identity-server/commit/00b5904cd715de2cf37424c80e5b76f1a1062950))
* **transfer:** Add logic to resubmit tnx on timeouts ([42e4a10](https://github.com/AraBlocks/ara-identity-server/commit/42e4a10108d4f458b0104ee8dd78f862840f83f0))
* **transfer:** First pass at Setting Gas price using Gas station API ([00e7837](https://github.com/AraBlocks/ara-identity-server/commit/00e7837b4725075ced63997d0817eac8841b215d))
* Add check for environment variables ([3be830f](https://github.com/AraBlocks/ara-identity-server/commit/3be830f18c52ae16a82f66b8240dd0937a2d25d5))
* Add config folder ([f117bb3](https://github.com/AraBlocks/ara-identity-server/commit/f117bb383813c55a1baecaae68ba2ed9bc4ed1a6))
* Add logic to update balance in rails backend ([6812cf9](https://github.com/AraBlocks/ara-identity-server/commit/6812cf9389a577247b7702793da7b0eaab3276a4))
* Add MAX_TOKEN check for transfer route ([12b33e9](https://github.com/AraBlocks/ara-identity-server/commit/12b33e92c224a26395f476c154d6da937a1b0162))
* Add separate folder for Util ([8788258](https://github.com/AraBlocks/ara-identity-server/commit/878825812c6aad42069e799d049fc716c764d416))
* Add separate module for Redis ([f00d013](https://github.com/AraBlocks/ara-identity-server/commit/f00d0135d9d2d300107c5b21949571b3d85a233d))
* Add systemd service file for the API ([e7274a6](https://github.com/AraBlocks/ara-identity-server/commit/e7274a614ca17aca48afb469865756e33a040159))
* Mission API V2 Integration ([064e1f5](https://github.com/AraBlocks/ara-identity-server/commit/064e1f5e8bbdda53654f4534f3a9337ebf8e3c49))
* systemd env variables ([8b9f1ad](https://github.com/AraBlocks/ara-identity-server/commit/8b9f1adb67cce6f45fca09c8fd39094a6c52fb17))
* Update service file for deployment ([d0e71ad](https://github.com/AraBlocks/ara-identity-server/commit/d0e71ad598fc7adf5ae265b7da3d6d4358872450))
* Update systemd env variables ([408cf6c](https://github.com/AraBlocks/ara-identity-server/commit/408cf6c9d187b6dad095480a19fc4aca3cb088f2))
* Update systemd service file ([588516e](https://github.com/AraBlocks/ara-identity-server/commit/588516ed561dfb54cff3d687958989cb6dd7d00a))
* **transfer.js:** Refactor token transfer method ([2ec3da1](https://github.com/AraBlocks/ara-identity-server/commit/2ec3da1e76abe8e925e45ad90bbd9c4d6cf44d7e))
* **util:** Add method to submit Transaction ([5cf6f06](https://github.com/AraBlocks/ara-identity-server/commit/5cf6f06c541c95f1c9aed12f67a652dbafd533e5))
* **util:** Refactor Authentication Key methods ([f4e7cdf](https://github.com/AraBlocks/ara-identity-server/commit/f4e7cdf95bb70761441967a7b4a09a397fe000bb))



# [0.1.0](https://github.com/AraBlocks/ara-identity-server/compare/c7bb3592ce5e7e0e215fb679355632094d3ef382...0.1.0) (2018-09-13)


### Bug Fixes

* **index.js:** Change resolve response to match did-resolution spec ([f6cc36f](https://github.com/AraBlocks/ara-identity-server/commit/f6cc36faba9cce4392e598075c8705d54ececcf7))
* **index.js:** Make server listen on conf.port ([a5d4402](https://github.com/AraBlocks/ara-identity-server/commit/a5d4402f7741fcb7c3d6aef1e37004184b999cf7))
* **index.js:** Typo in error message ([fbbbe68](https://github.com/AraBlocks/ara-identity-server/commit/fbbbe6886ff920376a61a47103a21ca9059af4e1))
* **util.js:** Fix condition check ([6805fae](https://github.com/AraBlocks/ara-identity-server/commit/6805faeb84de5f7e482182dbdd997e8530283cc5))


### Features

* Add discoveryKey.txt file to fixtures ([a4fea62](https://github.com/AraBlocks/ara-identity-server/commit/a4fea623a1e88746d109ef0f8c559212fdaf417a))
* Add docker and Makefile ([9f84b83](https://github.com/AraBlocks/ara-identity-server/commit/9f84b8320f929046d791a1170588e93986b4f921))
* Change passphrase to request.body in create & Update README ([527520c](https://github.com/AraBlocks/ara-identity-server/commit/527520c2ea3f0410f9a1b004a71a12a315bdebce))
* Fix linting ([0db532c](https://github.com/AraBlocks/ara-identity-server/commit/0db532cd32c8e8b7871a7b0e91d69dc7bad7da15))
* Fix typo in test ([d227687](https://github.com/AraBlocks/ara-identity-server/commit/d227687d2c8cccd2489629e95b58e05314c59df1))
* **index.js:** Fix branch issues ([86c5269](https://github.com/AraBlocks/ara-identity-server/commit/86c5269c2bfd45cbbf254ed5f1fb2cef60cce340))
* Initial Commit with simple http server ([c7bb359](https://github.com/AraBlocks/ara-identity-server/commit/c7bb3592ce5e7e0e215fb679355632094d3ef382))
* **index.js:** Add authentication using ara network secrets ([78d2300](https://github.com/AraBlocks/ara-identity-server/commit/78d2300de0f70dbbf1fa48614d9859b58afa8987))
* **index.js:** Add DDO to the create api response ([08f940d](https://github.com/AraBlocks/ara-identity-server/commit/08f940d134228e1c52efe8fc0c18d80f8515fbe9))
* **index.js:** Add error handling ([70dbecc](https://github.com/AraBlocks/ara-identity-server/commit/70dbeccf6cd0e3898b383aee3d6eb8d0a166a95b))
* **index.js:** Add methods for error-handling and method restrictions ([e28fed8](https://github.com/AraBlocks/ara-identity-server/commit/e28fed8af7f4107016cbb8c7f7fcc4c7d2599d94))
* **index.js:** Add path to identities in conf obj ([8dcc995](https://github.com/AraBlocks/ara-identity-server/commit/8dcc995f0068e8ad8ff7a8882b4e25b80ab53165))
* **index.js:** Add proper authentication & util methods ([3ac7e27](https://github.com/AraBlocks/ara-identity-server/commit/3ac7e2785864f5489b8c2ef9a7d5ec7da67f1003))
* **index.js:** Add request timeout logic ([1e9d375](https://github.com/AraBlocks/ara-identity-server/commit/1e9d3754afd8ae4016c1b595b8837554c2743e13))
* **index.js:** Add simple stop-gap authentication solution ([3888e3a](https://github.com/AraBlocks/ara-identity-server/commit/3888e3aab88d52a4dca02f94f3695a735f184669))
* **index.js:** Add status route & change resolve response format ([44d6402](https://github.com/AraBlocks/ara-identity-server/commit/44d6402de6e56a3e99536fa987322c8ed84fcc07))
* **index.js:** Add support for both http & https ([e0129a4](https://github.com/AraBlocks/ara-identity-server/commit/e0129a4d512a5a04b559f1dc7eb8d18acac3dd56))
* **index.js:** Change http routes to match with other network node standard ([08a55fc](https://github.com/AraBlocks/ara-identity-server/commit/08a55fc12ff2c9a0ecf2e26b5f6f457cc987da88))
* **index.js:** Change return code for process error ([bc88b92](https://github.com/AraBlocks/ara-identity-server/commit/bc88b923155ac374f049cffedcc6882213393aef))
* **index.js:** Fix branch issues ([8cad3f4](https://github.com/AraBlocks/ara-identity-server/commit/8cad3f44ec6411a3013b615b131b03c4b7686324))
* **index.js:** Fix CLI rules ([b771e9e](https://github.com/AraBlocks/ara-identity-server/commit/b771e9ee71801f081bc4263c4e7e7503004c3d01))
* **index.js:** Fix CLI rules ([1e99066](https://github.com/AraBlocks/ara-identity-server/commit/1e990665b6c99fa5b7c573b44e7d2dd8c8105f7d))
* **index.js:** Fix linting ([c1ae646](https://github.com/AraBlocks/ara-identity-server/commit/c1ae646106b11c5da7bc9c7b7980c6c6917fae07))
* **index.js:** Fix PR feedback ([be11d5c](https://github.com/AraBlocks/ara-identity-server/commit/be11d5c2012519c535e63cd72b6d7f7489330ec4))
* **index.js:** Fix PR Feedback and add proper status codes ([0c03923](https://github.com/AraBlocks/ara-identity-server/commit/0c039231332bc23a19cb89f61f2bc76f7df524dd))
* **index.js:** Fix resolve http method ([3c6d37f](https://github.com/AraBlocks/ara-identity-server/commit/3c6d37f1336e005326b8d57b4cb35c6f398b3780))
* **index.js:** Fix typo ([365bd29](https://github.com/AraBlocks/ara-identity-server/commit/365bd2903644527d6965fec00e45959e3b659121))
* **index.js:** Refactor logic to have just create & resolve endpoints ([59229f5](https://github.com/AraBlocks/ara-identity-server/commit/59229f5bbc9ec5b9f525a5703e441b574bcb8049))
* **index.js:** Refactor logic to have just create & resolve endpoints ([118cb91](https://github.com/AraBlocks/ara-identity-server/commit/118cb9196d99450420d16d95f8f3c84fdfaaf741))
* **index.js:** Refactor methods and error handling ([428b13c](https://github.com/AraBlocks/ara-identity-server/commit/428b13c750719f658ea3e610c7cf567d3bea674d))
* **index.js:** Refactor to start using either secret/public keyring file ([e2e8b74](https://github.com/AraBlocks/ara-identity-server/commit/e2e8b74718d18553939f03b968892cc04e8182b5))
* **index.js:** Refactor to use util.getServerKey() ([0b48848](https://github.com/AraBlocks/ara-identity-server/commit/0b48848154a8579b0ebb5087cc00b81eaf1f4d07))
* **index.js:** Remove redundant code ([add513e](https://github.com/AraBlocks/ara-identity-server/commit/add513e8fc1bac74e997a28579b1bcb8a215e234))
* **package.json:** Disable npm test for now ([7827f0b](https://github.com/AraBlocks/ara-identity-server/commit/7827f0bb88a7c1b8980d5f9c7e42336064d5b09b))
* **test/index.js:** Fix tests to send passphrase in body ([a203841](https://github.com/AraBlocks/ara-identity-server/commit/a2038419fb69194d48409026e3256156aa9f6574))



