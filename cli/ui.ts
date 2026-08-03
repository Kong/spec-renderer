import { createColors } from 'picocolors'

// picocolors' default export auto-detects color support and disables it for
// a non-TTY stdout (e.g. output piped to a file or another process) - the
// preview banner/log lines are always meant to be colored when read in a
// terminal, so force it on regardless of how stdout is connected. `NO_COLOR`
// is still honored, since it's the standard explicit user opt-out. Exported
// so other CLI modules (e.g. `commands/preview.ts`) share the same forced
// instance rather than importing picocolors' auto-detecting default directly.
export const pc = createColors(!process.env.NO_COLOR)

const BOX_TITLE = 'Kong Spec Renderer - Preview'

// Caps the box at a width that fits comfortably in a typical terminal - a
// long spec path/URL wraps onto continuation lines instead of pushing the
// box wider than the terminal, which breaks the border rendering.
const MAX_CONTENT_WIDTH = 96

// eslint-disable-next-line no-control-regex -- matches ANSI SGR escape codes and OSC 8 hyperlink wrappers, which are control characters by definition
const ANSI_PATTERN = /\x1B\[[0-9;]*m|\x1B\]8;[^\x07]*\x07/g

/** Visible length of a string, ignoring ANSI color escape codes and OSC 8 hyperlink wrappers. */
export function visibleLength(text: string): number {
  return text.replace(ANSI_PATTERN, '').length
}

/**
 * Wraps `text` in an OSC 8 terminal hyperlink pointing at `url`, so it's
 * clickable in terminals that support it (iTerm2, Kitty, Windows Terminal,
 * VS Code's integrated terminal, etc.) - falls back to plain, unlinked text
 * everywhere else with no visible difference.
 */
export function hyperlink(text: string, url: string): string {
  return `\x1B]8;;${url}\x07${text}\x1B]8;;\x07`
}

/** Strips ANSI color escape codes from a string. */
function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}

/** Hard-wraps plain text into chunks of at most `width` characters. */
function wrapPlain(text: string, width: number): string[] {
  if (text.length <= width) {
    return [text]
  }

  const chunks: string[] = []

  for (let i = 0; i < text.length; i += width) {
    chunks.push(text.slice(i, i + width))
  }

  return chunks
}

export interface BannerRow {
  label: string
  value: string
}

/**
 * Builds the lines of a bordered summary box (spec source, URL, live-reload
 * status), aligned by visible length.
 *
 * `value` may contain ANSI color codes - widths are computed from visible
 * length so colored values don't throw off the box's alignment. A value
 * longer than fits within `maxContentWidth` wraps onto continuation lines;
 * since wrapping a colored value risks splitting mid-escape-sequence, an
 * over-long value wraps as plain text instead (long values are spec paths/
 * URLs, which aren't colored today anyway). Split out from
 * `printPreviewBanner` so the alignment math is unit-testable without
 * capturing console output or mocking terminal width.
 */
export function buildBannerLines(rows: BannerRow[], maxContentWidth: number = MAX_CONTENT_WIDTH): string[] {
  const labelWidth = Math.max(...rows.map((row) => row.label.length))
  const valueWidth = Math.max(20, maxContentWidth - labelWidth - 2)

  const wrappedRows = rows.map((row) => ({
    label: row.label,
    valueLines: visibleLength(row.value) <= valueWidth
      ? [row.value]
      : wrapPlain(stripAnsi(row.value), valueWidth),
  }))

  const contentWidth = Math.max(
    BOX_TITLE.length,
    ...wrappedRows.flatMap((row) => row.valueLines.map((line) => labelWidth + 2 + visibleLength(line))),
  )
  const horizontal = '─'.repeat(contentWidth + 2)

  const lines = [
    pc.cyan(`┌${horizontal}┐`),
    `${pc.cyan('│')} ${pc.bold(BOX_TITLE.padEnd(contentWidth))} ${pc.cyan('│')}`,
    pc.cyan(`├${horizontal}┤`),
  ]

  for (const row of wrappedRows) {
    row.valueLines.forEach((line, index) => {
      const label = index === 0 ? row.label.padEnd(labelWidth) : ' '.repeat(labelWidth)
      const padding = ' '.repeat(contentWidth - labelWidth - 2 - visibleLength(line))

      lines.push(`${pc.cyan('│')} ${pc.dim(label)}  ${line}${padding} ${pc.cyan('│')}`)
    })
  }

  lines.push(pc.cyan(`└${horizontal}┘`))

  return lines
}

/**
 * The box's content width, capped to the actual terminal width when known
 * (interactive terminals report `process.stdout.columns`; piped/non-TTY
 * output does not, so `MAX_CONTENT_WIDTH` is used as a sane default).
 */
function terminalAwareMaxWidth(): number {
  const terminalWidth = process.stdout.columns

  if (!terminalWidth) {
    return MAX_CONTENT_WIDTH
  }

  // Leave room for the box's own border/padding characters (`│ ` + ` │`).
  return Math.max(20, Math.min(MAX_CONTENT_WIDTH, terminalWidth - 4))
}

/** Prints a bordered summary box for the running preview server. */
export function printPreviewBanner(rows: BannerRow[]): void {
  for (const line of buildBannerLines(rows, terminalAwareMaxWidth())) {
    console.log(line)
  }
}

export const success = (message: string): void => console.log(`${pc.green('✔')} ${message}`)
export const info = (message: string): void => console.log(`${pc.cyan('i')} ${message}`)
export const warn = (message: string): void => console.log(`${pc.yellow('⚠')} ${pc.yellow(message)}`)
export const error = (message: string): void => console.error(`${pc.red('✖')} ${pc.red(message)}`)
