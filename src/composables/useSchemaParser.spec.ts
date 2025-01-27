import { describe, it, expect } from 'vitest'
import composables from '.'
import stripeSpec from '../../sandbox/public/specs/stripe.json'

describe('useSchemaParser', () => {
  describe('inline-refs', () => {
    it('should handle invalid  local refs', async () => {
      const specText = `
openapi: 3.1.0
info:
  title: Swagger Petstore - OpenAPI 3.1
  version: 1.0.11

components:
  schemas:
    ApiResponse:
      type: object
      properties:
        type:
          type: string
          example: '#default'
        message:
          type: string
`
      const { parseSpecDocument, parsedDocument } = composables.useSchemaParser()
      await parseSpecDocument(specText)

      const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/ApiResponse')
      expect(node.data.properties.type.example).toEqual('#default')
    })

    it('should handle unresolvable local refs', async () => {
      const specText = `
openapi: 3.1.0
info:
  title: Swagger Petstore - OpenAPI 3.1
  version: 1.0.11

components:
  schemas:
    ApiResponse:
      type: object
      properties:
        type:
          type: string
          example: '#/default'
        message:
          type: string
`
      const { parseSpecDocument, parsedDocument } = composables.useSchemaParser()
      await parseSpecDocument(specText)

      const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/ApiResponse')
      expect(node.data.properties.type.example).toEqual('#/default')
    })

    it('should resolve nested refs', async () => {
      const specText = `
openapi: 3.1.0
info:
  title: Swagger Petstore - OpenAPI 3.1
  version: 1.0.11

components:
  schemas:
    Base:
      type: object
      example: "Base"
      title: BaseTitle
    Middle:
      type: object
      example: "Middle"
      title: MiddleTitle
      properties:
        $ref: "#/components/schemas/Base"
    Top:
      $ref: "#/components/schemas/Middle"

          `
      const { parseSpecDocument, parsedDocument } = composables.useSchemaParser()
      await parseSpecDocument(specText)

      const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/Top')
      expect(node.data).toEqual({
        type: 'object',
        example: 'Middle',
        title: 'MiddleTitle',
        properties: {
          type: 'object',
          example: 'Base',
          title: 'BaseTitle',
        },
      })
    })

  })

  it('should use key as a title during the resolution, if no title found in ref', async () => {
    const specText = `
openapi: 3.1.0
info:
  title: Swagger Petstore - OpenAPI 3.1
  version: 1.0.11

components:
  schemas:
    Base:
      type: object
      example: "Base"
    Middle:
      type: object
      example: "Middle"
      properties:
        $ref: "#/components/schemas/Base"
    Top:
      $ref: "#/components/schemas/Middle"

          `
    const { parseSpecDocument, parsedDocument } = composables.useSchemaParser()
    await parseSpecDocument(specText)

    const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/Top')
    expect(node.data).toEqual({
      type: 'object',
      example: 'Middle',
      title: 'Middle',
      properties: {
        type: 'object',
        example: 'Base',
        title: 'Base',
      },
    })
  })

  describe('parsing properties', () => {
    const specText = `
openapi: 3.0.0
servers: []
info:
  version: "1.0.0"
  title: home-iot-api
  description: The API
paths:
  /devices:
    get:
      description: here we go
      deprecated: true
      x-internal: true
components:
  schemas:
    ApiResponse:
      type: object
      properties:
        code:
          type: integer
          format: int32
      `
    const endpoints = [{
      id: '/paths/devices/get',
      meta: 'get',
      slug: '/paths/devices/get',
      title: '/devices',
      type: 'http_operation',
      deprecated: true,
    }]

    const schemaId = '/schemas/ApiResponse'

    const schemas = [{
      id: schemaId,
      meta: '',
      slug: schemaId,
      title: 'ApiResponse',
      type: 'model',
    }]

    it('should include schemas by default', async () => {
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specText)

      expect(tableOfContents.value).toEqual(
        expect.arrayContaining([{ title: 'Schemas', items: schemas, initiallyExpanded: false }]),
      )
    })

    it('should exclude schemas when param passed', async () => {
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specText, { hideSchemas: true })

      expect(tableOfContents.value).not.toEqual(
        expect.arrayContaining([{ title: 'Schemas', items: schemas, initiallyExpanded: false }]))
    })

    it('should include deprecated endpoints by default', async () => {
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specText)
      expect(tableOfContents.value).toEqual(
        expect.arrayContaining([{ title: 'Endpoints', items: endpoints, initiallyExpanded: true }]))
    })

    it('should exclude deprecated endpoints when param passed', async () => {
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specText, { hideDeprecated: true })
      expect(tableOfContents.value).not.toEqual([{ title: 'Endpoints', items: endpoints, initiallyExpanded: true }])
    })

    it('should include internal endpoints by default', async () => {
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specText)
      expect(tableOfContents.value).toEqual(
        expect.arrayContaining([{ title: 'Endpoints', items: endpoints, initiallyExpanded: true }]))
    })

    it('should exclude internal endpoints when param passed', async () => {
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specText, { hideInternal: true })
      expect(tableOfContents.value).not.toEqual([{ title: 'Endpoints', items: endpoints, initiallyExpanded: true }])
    })

    it('should render groups containing active item in expanded state', async () => {
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specText, { currentPath: schemaId })
      expect(tableOfContents.value).toEqual(
        expect.arrayContaining([{ title: 'Schemas', items: schemas, initiallyExpanded: true }]))
    })
  })

  it('should not hangup on de-referencing large file (stripe) [KHCP-11974]', async () => {
    const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
    await parseSpecDocument(stripeSpec)
    expect(tableOfContents.value.length).toEqual(3)
    expect(tableOfContents.value[1].items.length).toEqual(533) // endpoints
    expect(tableOfContents.value[2].items.length).toEqual(979) // schemas
  })

  describe('multi-tag operations KHCP-14794', () => {
    it('should create TOD with multiple items according to multitags', async () => {

      const specContent = `
openapi: 3.1.0
info:
  title: Beer API
  description: API for managing beers
  version: 1.0.0
servers:
  - url: https://ff90af76a1.gateways.konghq.tech
paths:
  /beers/ale:
    put:
      summary: VIew list of beers
      responses:
        '200':
          description: A list of beers
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Beer'

    get:
      summary: Get list of beers
      responses:
        '200':
          description: A list of beers
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Beer'
      tags:
        - System
        - Mesh

    post:
      summary: Add a new beer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Beer'
      responses:
        '201':
          description: Beer created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Beer'
      tags:
        - System
    delete:
      summary: Delete a beer
      parameters:
        - in: query
          name: id
          schema:
            type: integer
          required: true
          description: ID of the beer to delete
      responses:
        '200':
          description: Beer deleted
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Beer deleted successfully"
        '404':
          description: Beer not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Beer not found"
      tags:
        - Mesh
components:
  schemas:
    Beer:
      type: object
      properties:
        price:
          type: string
          example: "$16.99"
        name:
          type: string
          example: "Founders All Day IPA"
        rating:
          type: object
          properties:
            average:
              type: number
              example: 4.411243509154233
            reviews:
              type: integer
              example: 453
        image:
          type: string
          example: "https://www.totalwine.com/media/sys_master/twmmedia/h00/h94/11891416367134.png"
        id:
          type: integer
          example: 1

      `
      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specContent)

      expect(tableOfContents.value?.length).toEqual(3)
      expect(tableOfContents.value[1].items[1].items[0].id).toEqual('/paths/beers-ale/get')
      expect(tableOfContents.value[1].items[2].items[0].id).toEqual('/paths/mesh/beers-ale/get')

    })
  })
})


