## [1.6.3](https://github.com/Kong/spec-renderer/compare/v1.6.2...v1.6.3) (2024-05-14)


### Bug Fixes

* render anyOf/oneOf when they are present as top level fields  [khcp 11893] ([#57](https://github.com/Kong/spec-renderer/issues/57)) ([2f043c6](https://github.com/Kong/spec-renderer/commit/2f043c65085f8ad94cebf8f095f4619e6d08b4c1))
* ssr (clodfarew worker) related issues [KHCP-11923] ([#59](https://github.com/Kong/spec-renderer/issues/59)) ([bec9ab5](https://github.com/Kong/spec-renderer/commit/bec9ab50c18a2e5c4703ce10165c818a08a2d1de))

## [1.6.2](https://github.com/Kong/spec-renderer/compare/v1.6.1...v1.6.2) (2024-05-14)


### Bug Fixes

* breakage when null present in oneOf/anyOf lists [KHCP-11931] ([#58](https://github.com/Kong/spec-renderer/issues/58)) ([01ad993](https://github.com/Kong/spec-renderer/commit/01ad993ae4e8788aa05d649e886d96468977dbbc))

## [1.6.1](https://github.com/Kong/spec-renderer/compare/v1.6.0...v1.6.1) (2024-05-14)


### Bug Fixes

* support oneOf/anyOf for arrays [KHCP-11892] ([#51](https://github.com/Kong/spec-renderer/issues/51)) ([4125fcf](https://github.com/Kong/spec-renderer/commit/4125fcf965ecadcc3b0010994cb46f85f20146d0))

# [1.6.0](https://github.com/Kong/spec-renderer/compare/v1.5.1...v1.6.0) (2024-05-14)


### Features

* passing props into parsing [KHCP-11900] ([#53](https://github.com/Kong/spec-renderer/issues/53)) ([62b7c1c](https://github.com/Kong/spec-renderer/commit/62b7c1c56fcd23708dd32a9619622a6b4ff0fd67))

## [1.5.1](https://github.com/Kong/spec-renderer/compare/v1.5.0...v1.5.1) (2024-05-13)


### Bug Fixes

* component rename for exported ([#54](https://github.com/Kong/spec-renderer/issues/54)) ([ff44104](https://github.com/Kong/spec-renderer/commit/ff44104d868fc33cea74bb780de4873c1d1557d2))

# [1.5.0](https://github.com/Kong/spec-renderer/compare/v1.4.2...v1.5.0) (2024-05-13)


### Features

* trigger release ([221e13a](https://github.com/Kong/spec-renderer/commit/221e13a37d9171379900fcb2280a9567511c4992))

## [1.4.2](https://github.com/Kong/spec-renderer/compare/v1.4.1...v1.4.2) (2024-05-10)


### Bug Fixes

* document nodes need a single root element ([#46](https://github.com/Kong/spec-renderer/issues/46)) ([246b44c](https://github.com/Kong/spec-renderer/commit/246b44cea1c7a649fa09309630fcdc3c43e6fe3a))

## [1.4.1](https://github.com/Kong/spec-renderer/compare/v1.4.0...v1.4.1) (2024-05-10)


### Bug Fixes

* references (inline and external) [KHCP-11660, KHCP-11783, KHCP-11814] ([#43](https://github.com/Kong/spec-renderer/issues/43)) ([ab73f89](https://github.com/Kong/spec-renderer/commit/ab73f894ff598e54db08e7d2228fc5298d6f8a69))

# [1.4.0](https://github.com/Kong/spec-renderer/compare/v1.3.0...v1.4.0) (2024-05-09)


### Features

* add support for anyOf and oneOf fields [KHCP-11677] ([#40](https://github.com/Kong/spec-renderer/issues/40)) ([40882ad](https://github.com/Kong/spec-renderer/commit/40882ad62f6ef59e87da9bfe7d73f30195009e22))

# [1.3.0](https://github.com/Kong/spec-renderer/compare/v1.2.1...v1.3.0) (2024-05-07)


### Features

* add components for individual schema properties [KHCP-11732] ([#38](https://github.com/Kong/spec-renderer/issues/38)) ([c11b469](https://github.com/Kong/spec-renderer/commit/c11b4695d54a3ea092c76ea88bff2f59cf3491e8))

## [1.2.1](https://github.com/Kong/spec-renderer/compare/v1.2.0...v1.2.1) (2024-05-01)


### Bug Fixes

* in TOC format links so they are right-clickable [KHCP-11715] ([#32](https://github.com/Kong/spec-renderer/issues/32)) ([d6d45b9](https://github.com/Kong/spec-renderer/commit/d6d45b9b0637b11fe5023fed24c48abf7810e8ed))

# [1.2.0](https://github.com/Kong/spec-renderer/compare/v1.1.0...v1.2.0) (2024-05-01)


### Features

* schema model render [KHCP-11676] ([#22](https://github.com/Kong/spec-renderer/issues/22)) ([99a020f](https://github.com/Kong/spec-renderer/commit/99a020fb51aea4153d8231b33b04ff6dd3fe6b46))

# [1.1.0](https://github.com/Kong/spec-renderer/compare/v1.0.5...v1.1.0) (2024-04-29)


### Bug Fixes

* **deps:** update all non-major dependencies with stable version ([#26](https://github.com/Kong/spec-renderer/issues/26)) ([8ffa619](https://github.com/Kong/spec-renderer/commit/8ffa619f8e96b1853617c15ee326d0812ea9743e))
* prepare for dev-portal integration [KHCP-11679] ([#29](https://github.com/Kong/spec-renderer/issues/29)) ([3264399](https://github.com/Kong/spec-renderer/commit/3264399f03eb04f669677057b97121d2a75563a4))
* prevent sidebar growing and causing content to shrink ([#28](https://github.com/Kong/spec-renderer/issues/28)) ([f205141](https://github.com/Kong/spec-renderer/commit/f205141e7c98476ba645780bf691259074f1e001))


### Features

* **base.scss:** add base stylesheet for sandbox ([#27](https://github.com/Kong/spec-renderer/issues/27)) ([7d3ad81](https://github.com/Kong/spec-renderer/commit/7d3ad81648e8a5d9ec3d997b3cce824f8a19f2b5))

## [1.0.5](https://github.com/Kong/spec-renderer/compare/v1.0.4...v1.0.5) (2024-04-24)


### Bug Fixes

* broken  sandbox due to old vue-router version ([#21](https://github.com/Kong/spec-renderer/issues/21)) ([61bc001](https://github.com/Kong/spec-renderer/commit/61bc0010707a5fedfcb102bedfebcfd7c2b305ec))

## [1.0.4](https://github.com/Kong/spec-renderer/compare/v1.0.3...v1.0.4) (2024-04-24)


### Bug Fixes

* **deps:** update dependency @scalar/openapi-parser to ^0.3.2 ([#13](https://github.com/Kong/spec-renderer/issues/13)) ([84d96e9](https://github.com/Kong/spec-renderer/commit/84d96e90e467c3fca6c96e5b3a82032c155be27f))

## [1.0.3](https://github.com/Kong/spec-renderer/compare/v1.0.2...v1.0.3) (2024-04-23)


### Bug Fixes

* **deps:** update dependency @kong/icons to ^1.9.1 ([#17](https://github.com/Kong/spec-renderer/issues/17)) ([c51ea29](https://github.com/Kong/spec-renderer/commit/c51ea29d4ab96cdb51cb16ebc3f7bdf453ea5329))

## [1.0.2](https://github.com/Kong/spec-renderer/compare/v1.0.1...v1.0.2) (2024-04-23)


### Bug Fixes

* **deps:** update dependency @kong/icons to ^1.9.0 ([#16](https://github.com/Kong/spec-renderer/issues/16)) ([89fd348](https://github.com/Kong/spec-renderer/commit/89fd34887b1c9efed9cad054499f702a472ab40e))

## [1.0.1](https://github.com/Kong/spec-renderer/compare/v1.0.0...v1.0.1) (2024-04-23)


### Bug Fixes

* codeowners file name ([#15](https://github.com/Kong/spec-renderer/issues/15)) ([757b0cd](https://github.com/Kong/spec-renderer/commit/757b0cd199995e3582ba575687181a4b6659c07f))

# 1.0.0 (2024-04-22)


### Features

* initial check-in with parsing functionality [KHCP-11551] ([#8](https://github.com/Kong/spec-renderer/issues/8)) ([536471f](https://github.com/Kong/spec-renderer/commit/536471f58c812ece9b3264d4504064a5e65570fd))
* initial commit :rocket: ([52a2d46](https://github.com/Kong/spec-renderer/commit/52a2d46b978fc18a43ba02454f0294a6356f1383))
