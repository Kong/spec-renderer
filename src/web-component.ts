// Re-export everything from index
export * from './index'

// Import the register function
import { registerKongSpecRenderer } from './index'

// Automatically register the web components so the host application doesn't have to do it manually
registerKongSpecRenderer()
