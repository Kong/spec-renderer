#!/usr/bin/env node
import { createProgram } from './program.js'
import { error as printError } from './ui.js'

try {
  await createProgram().parseAsync(process.argv)
} catch (error) {
  printError(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
