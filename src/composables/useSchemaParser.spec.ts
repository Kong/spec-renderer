import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import composables from '.'
import stripeSpec from '../../sandbox/public/specs/stripe.json'
import type { ServiceNode } from '@/types'

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

  describe('security scopes', () => {
    it('should parse security scopes', async () => {

      const specContent = `
openapi: 3.1.0
info:
  title: Red Wine API
  description: API for retrieving information about red wines.
  version: 1.0.0
servers:
  - url: https://kong-a854e05124usljo2h.kongcloud.dev
    description: Main API server

security:
  - ClientCredentialAuth: []

tags:
  - name: Wines
    description: Operations related to wine information

paths:
  /wines/reds:
    get:
      summary: List all red wines with pagination
      description: Retrieves a list of red wines with pagination.
      operationId: listRedWines
      tags:
        - Wines
      responses:
        '200':
          description: Successful operation
components:
  securitySchemes:
    ClientCredentialAuth:
      type: oauth2
      description: OAuth2 client credentials flow
      flows:
        clientCredentials:
          tokenUrl: https://xy8c8zqt7hpjdhcp.us.identity.konghq.com/auth/oauth/token
          scopes:
            read: Grants read access
            write: Grants write access
    `
      const { parseSpecDocument, parsedDocument } = composables.useSchemaParser()
      await parseSpecDocument(specContent)
      const scopes = {
        'read': 'Grants read access',
        'write': 'Grants write access',
      }

      expect((parsedDocument.value as ServiceNode).data.securitySchemes[0].flows.clientCredentials.scopes).toEqual(scopes)
      expect((parsedDocument.value as ServiceNode).data.security[0][0].flows.clientCredentials.scopes).toEqual(scopes)
      expect((parsedDocument.value as ServiceNode).children[0].data.security[0][0].flows.clientCredentials.scopes).toEqual(scopes)
    })
  })

  describe('async api parsing', () => {

    it('should parse avro', async () => {
      const specContent = `asyncapi: 3.0.0
info:
  title: Traffic Light Events
  version: '1.0.0'

servers:
  kafka-broker:
    host: localhost:9092
    protocol: kafka

channels:
  traffic-light.state:
    address: traffic-light.state
    messages:
      trafficLightState:
        $ref: "#/components/messages/TrafficLightStateMessage"

operations:
  publishTrafficLightState:
    action: send
    channel:
      $ref: "#/channels/traffic-light.state"
    messages:
      - $ref: "#/channels/traffic-light.state/messages/trafficLightState"

  consumeTrafficLightState:
    action: receive
    channel:
      $ref: "#/channels/traffic-light.state"
    messages:
      - $ref: "#/channels/traffic-light.state/messages/trafficLightState"

components:
  messages:
    TrafficLightStateMessage:
      name: TrafficLightStateMessage
      title: Traffic Light State
      summary: Current state of a traffic light
      contentType: application/avro-binary
      payload:
        schemaFormat: application/vnd.apache.avro+json;version=1.9.0
        schema:
          type: record
          name: TrafficLightState
          namespace: com.example.traffic
          fields:
            - name: intersectionId
              type: string
            - name: state
              type:
                type: enum
                name: LightState
                symbols: ["RED", "YELLOW", "GREEN"]
            - name: changedAt
              type: string
`

      const { parseSpecDocument, tableOfContents } = composables.useSchemaParser()
      await parseSpecDocument(specContent)
      expect(tableOfContents.value?.length).toEqual(3)

    })
  })
})

describe('extensions', () => {
  it('should parse x-kong-client-credentials-config extension', async () => {
    const specContent = `
openapi: 3.1.0
info:
  title: OAuth2 Client Credentials Flow API
  version: 1.0.0
  description: API demonstrating OAuth2 Client Credentials flow.

servers:
  - url: 'https://example.com/api'
    description: Main server

components:
  securitySchemes:
    oauth2:
      type: oauth2
      x-kong-client-credentials-config:
        extraTokenRequestParameters:
          - name: organization
            label: Organization
            description: The organization identifier
            omitIfEmpty: true
            required: true
          - name: audience
            label: Audience
            value: https://api.vitu.com/v1
      flows:
        clientCredentials:
          tokenUrl: 'https://example.com/oauth/token'
          scopes:
            read:products: Grants read access to products
            write:products: Grants write access to products

  schemas:
    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
          description: Unique identifier for the product
        name:
          type: string
          description: Name of the product
        description:
          type: string
          description: Detailed description of the product
      example:
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
        name: Sample Product
        description: This is a sample product description.

security:
  - oauth2: [read:products, write:products]

paths:
  /products:
    get:
      summary: Retrieve a list of products
      operationId: getProducts
      x-kong-client-credentials-config-onmethod:
        omitEmptyParameters: false
        extraTokenRequestParameters:
          - name: organization
          - name: audience
            value: https://api.vitu.com/v1
      tags:
        - Products
      security:
        - oauth2: [read:products]
      parameters:
        - name: limit
          in: query
          description: Maximum number of items to return
          schema:
            type: integer
            format: int32
            minimum: 1
            maximum: 100
            default: 20
        - name: offset
          in: query
          description: Number of items to skip for pagination
          schema:
            type: integer
            format: int32
            minimum: 0
            default: 0
      responses:
        '200':
          description: A list of products.
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  meta:
                    type: object
                    properties:
                      page:
                        type: object
                        properties:
                          offset:
                            type: integer
                            description: The number of items to skip.
                            example: 0
                          limit:
                            type: integer
                            description: The number of items to return.
                            example: 20
                          total:
                            type: integer
                            description: The total number of items available.
                            example: 100
                          estimated_total:
                            type: boolean
                            description: Indicates whether the total is an estimate.
                            example: true
        '401':
          description: Authentication required
        '403':
          description: Insufficient permissions

tags:
  - name: Products
    description: Operations related to products
`
    const { parseSpecDocument, parsedDocument } = composables.useSchemaParser()
    await parseSpecDocument(specContent)
    expect((parsedDocument.value as ServiceNode).data.securitySchemes[0].extensions['x-kong-client-credentials-config'].extraTokenRequestParameters).toEqual([
      {
        name: 'organization',
        label: 'Organization',
        description: 'The organization identifier',
        omitIfEmpty: true,
        required: true,
      },
      {
        name: 'audience',
        label: 'Audience',
        value: 'https://api.vitu.com/v1',
      },
    ])
  })

  describe('downloadSpecFile', () => {
    const jsonSpec = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    }, null, 2)

    const yamlSpec = `openapi: "3.1.0"
info:
  title: Test API
  version: "1.0.0"
paths: {}`

    let mockCreateObjectURL: ReturnType<typeof vi.fn>
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>
    let mockSetAttribute: ReturnType<typeof vi.spyOn>
    let mockClick: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url')
      mockRevokeObjectURL = vi.fn()
      mockClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      mockSetAttribute = vi.spyOn(HTMLAnchorElement.prototype, 'setAttribute')
      window.URL.createObjectURL = mockCreateObjectURL
      window.URL.revokeObjectURL = mockRevokeObjectURL
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    const getDownloadFilename = () => {
      const call = mockSetAttribute.mock.calls.find((args) => args[0] === 'download')
      return call?.[1] as string | undefined
    }

    const getCreatedBlob = () => mockCreateObjectURL.mock.calls[0]?.[0] as Blob

    it('downloads JSON spec as JSON with correct MIME type and filename', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(jsonSpec)

      await downloadSpecFile('json')

      expect(getCreatedBlob().type).toBe('application/json')
      expect(getDownloadFilename()).toBe('test-api.json')
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('downloads YAML spec as YAML with correct MIME type and filename', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(yamlSpec)

      await downloadSpecFile('yaml')

      expect(getCreatedBlob().type).toBe('text/yaml')
      expect(getDownloadFilename()).toBe('test-api.yaml')
      expect(mockClick).toHaveBeenCalled()
    })

    it('converts JSON spec to YAML for download', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(jsonSpec)

      await downloadSpecFile('yaml')

      expect(getCreatedBlob().type).toBe('text/yaml')
      expect(getDownloadFilename()).toBe('test-api.yaml')
      expect(mockClick).toHaveBeenCalled()
    })

    it('converts YAML spec to JSON for download', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(yamlSpec)

      await downloadSpecFile('json')

      expect(getCreatedBlob().type).toBe('application/json')
      expect(getDownloadFilename()).toBe('test-api.json')
      expect(mockClick).toHaveBeenCalled()
    })

    it('defaults to JSON format when spec starts with "{"', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(jsonSpec)

      await downloadSpecFile()

      expect(getCreatedBlob().type).toBe('application/json')
      expect(getDownloadFilename()).toMatch(/\.json$/)
    })

    it('defaults to YAML format when spec does not start with "{"', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(yamlSpec)

      await downloadSpecFile()

      expect(getCreatedBlob().type).toBe('text/yaml')
      expect(getDownloadFilename()).toMatch(/\.yaml$/)
    })

    it('uses kebab-cased spec title as filename', async () => {
      const specWithTitle = JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'My Cool API', version: '1.0.0' },
        paths: {},
      }, null, 2)

      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(specWithTitle)

      await downloadSpecFile('json')

      expect(getDownloadFilename()).toBe('my-cool-api.json')
    })

    it('falls back to spec-file when title and pathname are empty', async () => {
      const specNoTitle = JSON.stringify({
        openapi: '3.1.0',
        info: { version: '1.0.0' },
        paths: {},
      }, null, 2)

      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(specNoTitle)

      // Mock pathname to return '/' which becomes empty string after regex
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
        configurable: true,
      })

      await downloadSpecFile('json')

      expect(getDownloadFilename()).toBe('spec-file.json')
    })

    it('properly cleans up DOM and revokes object URL', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(jsonSpec)

      await downloadSpecFile('json')

      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('catches conversion errors and logs to console.error', async () => {
      const { parseSpecDocument, downloadSpecFile } = composables.useSchemaParser()
      await parseSpecDocument(jsonSpec)

      // Force JSON.parse to throw during conversion
      vi.spyOn(JSON, 'parse').mockImplementation(() => {
        throw new Error('parse error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await downloadSpecFile('yaml')

      expect(consoleSpy).toHaveBeenCalled()
      expect(mockClick).not.toHaveBeenCalled()
    })
  })
})

