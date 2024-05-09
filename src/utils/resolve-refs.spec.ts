import { describe, it, expect } from 'vitest'
import composables from '../composables'

describe('resolve-refs', () => {
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
      const { parse, parsedDocument, jsonDocument } = composables.useSchemaParser()
      await parse(specText)

      const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/ApiResponse')
      console.log('!!!!!!!', node)
      expect(resolved.properties.type.example).toEqual('#default')
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
      const { parse, parsedDocument, jsonDocument } = composables.useSchemaParser()
      await parse(specText)

      const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/ApiResponse')
      const resolved = resolveRefs(node.data, jsonDocument.value)
      expect(resolved.properties.type.example).toEqual('#/default')
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
      const { parse, parsedDocument, jsonDocument } = composables.useSchemaParser()
      await parse(specText)

      const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/Top')
      const resolved = resolveRefs(node.data, jsonDocument.value)
      console.log('resolved:', JSON.stringify(resolved, null, 2))
      expect(resolved).toEqual({
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
    const { parse, parsedDocument, jsonDocument } = composables.useSchemaParser()
    await parse(specText)

    const node = parsedDocument.value.children.find((child: any) => child.uri === '/schemas/Top')
    const resolved = resolveRefs(node.data, jsonDocument.value)
    expect(resolved).toEqual({
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
})
