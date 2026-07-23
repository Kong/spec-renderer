import { describe, expect, it, vi } from 'vitest'
import type { MessageInterface } from '@asyncapi/parser'
import { transformMessage } from './async-to-oas-transformer'

describe('transformMessage', () => {
  it('should preserve inline AsyncAPI message examples', () => {
    const example = {
      name: () => 'Profile update',
      summary: () => 'A profile update event',
      hasPayload: () => true,
      payload: () => ({ member: { id: '123' } }),
      hasHeaders: () => true,
      headers: () => ({ event: 'ACCOUNT' }),
    }
    const message = {
      id: () => 'accountEvent',
      description: vi.fn(),
      summary: vi.fn(),
      correlationId: vi.fn(),
      title: vi.fn(),
      examples: () => ({ all: () => [example] }),
      hasPayload: () => false,
    } as unknown as MessageInterface

    expect(transformMessage(message).data.messageExamples).toEqual([{
      name: 'Profile update',
      summary: 'A profile update event',
      payload: { member: { id: '123' } },
      headers: { event: 'ACCOUNT' },
    }])
  })
})
