// Jest custom reporter to aggregate and summarize all console calls across all test workers.
// Reads the aggregate file written by the setup script and prints a colorized summary.

const fs = require('fs')
const path = require('path')
const os = require('os')
const { BaseReporter } = require('@jest/reporters')
const colorPrefix = require('./colorPrefix')

// Path to the shared aggregate file in the OS temp directory
const AGGREGATE_PATH = path.join(os.tmpdir(), 'jest-console-counts.json')

const REPORTER_NAME = 'console-count'

const MAX_FILES = 5 // Maximum number of files to show in a single section in the summary

/**
 * Jest custom reporter to aggregate and summarize all console calls across all test workers.
 * Reads the aggregate file written by the setup script and prints a colorized summary.
 */
class ConsoleCountReporter extends BaseReporter {
  onRunStart() {
    // Remove any previous aggregate file
    try {
      fs.unlinkSync(AGGREGATE_PATH)
    } catch {}
  }

  onRunComplete(contexts, results) {
    const { counts, files, error } = this.readAggregate()
    // Count unique files across all messages
    const allFiles = files
      ? Array.from(
          new Set(
            Object.values(files).flatMap((fileMap) => Object.keys(fileMap))
          )
        )
      : []

    const coverageDir = path.resolve(process.cwd(), 'coverage')
    const outputPath = path.join(coverageDir, 'console-count-summary.md')
    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir, { recursive: true })
    }
    let markdown = ''
    // If there are no files, do not output anything
    if (allFiles.length === 0) {
      return
    }
    const shouldWriteMarkdown = allFiles.length >= 5

    if (error) {
      markdown += `\n## [${REPORTER_NAME}] Error reading aggregate: ${error}`
      // Print error to console
      console.log(`\n[${REPORTER_NAME}] Error reading aggregate: ${error}`)
    } else if (!counts || Object.keys(counts).length === 0) {
      markdown += `\n## [${REPORTER_NAME}] No console calls detected.`
      console.log(`\n[${REPORTER_NAME}] No console calls detected.`)
    } else {
      // Buffer output
      let buffer = ''
      buffer += `\n[${REPORTER_NAME}] Console call summary:`
      const methodTotals = this.aggregateMethodTotals(counts)
      Object.entries(methodTotals).forEach(([method, total]) => {
        buffer += '\n' + colorPrefix(method, `${method}: ${total}`)
      })

      // Top 1 error and warn message
      const topMsg = this.getTopMessagesByMethod(counts, 1)
      if (topMsg.error && topMsg.error.length > 0) {
        const [msg, count] = topMsg.error[0]
        buffer += `\n` + colorPrefix('error', 'error:') + ` "${msg}" - ${count}`
      }
      if (topMsg.warn && topMsg.warn.length > 0) {
        const [msg, count] = topMsg.warn[0]
        buffer += `\n` + colorPrefix('warn', 'warn:') + ` "${msg}" - ${count}`
      }

      if (shouldWriteMarkdown) {
        buffer += `\n\nFull summary available in ${outputPath}`
        markdown += this.generateMarkdownSummary(counts, files)
      }
      console.log(buffer)
    }
    if (shouldWriteMarkdown) {
      fs.writeFileSync(outputPath, markdown, 'utf8')
    }
  }
  /**
   * Returns the top N messages for each method.
   * @param {Object} counts - Map of "method:message" -> count.
   * @param {number} n - Number of top messages to return.
   * @returns {Object} Map of method -> array of [message, count]
   */
  getTopMessagesByMethod(counts, n = 1) {
    const methodMessages = {}
    Object.entries(counts).forEach(([key, count]) => {
      const [method, ...rest] = key.split(':')
      const message = rest.join(':').trim() || '<empty>'
      if (!methodMessages[method]) methodMessages[method] = []
      methodMessages[method].push([message, count])
    })
    Object.keys(methodMessages).forEach((method) => {
      methodMessages[method].sort((a, b) => b[1] - a[1])
      methodMessages[method] = methodMessages[method].slice(0, n)
    })
    return methodMessages
  }

  /**
   * Reads the aggregate file and returns { counts, error }
   */
  readAggregate() {
    try {
      if (fs.existsSync(AGGREGATE_PATH)) {
        const raw = fs.readFileSync(AGGREGATE_PATH, 'utf8')
        const parsed = JSON.parse(raw)
        return { counts: parsed.counts || {}, files: parsed.files || {} }
      }
      return { counts: {}, files: {} }
    } catch (e) {
      return { counts: {}, files: {}, error: e }
    }
  }

  /**
   * Generates a markdown summary of all console calls.
   * @param {Object} counts - Map of "method:message" -> count.
   * @param {Object} files - Map of "method:message" -> { filePath: count }.
   * @returns {string} Markdown summary.
   */
  generateMarkdownSummary(counts, files) {
    // Aggregate total counts per console method (e.g., log, warn, error)
    const methodTotals = this.aggregateMethodTotals(counts)
    // Aggregate counts per method per file
    const methodFileTotals = this.aggregateMethodFileTotals(counts, files)
    // Start markdown summary
    let md = `\n## [${REPORTER_NAME}] Console call summary:\n`
    // Add table of total counts per method
    md += this.renderMethodTotalsTable(methodTotals)
    md += '\n'
    // Add top messages per method
    md += this.renderTopMessagesByMethod(counts)
    return md
  }

  /**
   * Aggregates total counts for each console method.
   * @param {Object} counts - Map of "method:message" -> count.
   * @returns {Object} Map of method -> total count.
   */
  aggregateMethodTotals(counts) {
    const methodTotals = {}
    Object.entries(counts).forEach(([key, count]) => {
      const [method] = key.split(':')
      methodTotals[method] = (methodTotals[method] || 0) + count
    })
    return methodTotals
  }

  /**
   * Aggregates counts for each method and file.
   * @param {Object} counts - Map of "method:message" -> count.
   * @param {Object} files - Map of "method:message" -> { filePath: count }.
   * @returns {Object} Map of method -> { filePath -> count }.
   */
  aggregateMethodFileTotals(counts, files) {
    const methodFileTotals = {}
    Object.entries(counts).forEach(([key, count]) => {
      const [method] = key.split(':')
      if (files && files[key]) {
        if (!methodFileTotals[method]) methodFileTotals[method] = {}
        Object.entries(files[key]).forEach(([file, fileCount]) => {
          methodFileTotals[method][file] =
            (methodFileTotals[method][file] || 0) + fileCount
        })
      }
    })
    return methodFileTotals
  }

  /**
   * Renders a markdown table of total counts per console method.
   * @param {Object} methodTotals - Map of method -> total count.
   * @returns {string} Markdown table.
   */
  renderMethodTotalsTable(methodTotals) {
    let md = '\n| Console Method | Total Count |\n|---|---|\n'
    Object.entries(methodTotals).forEach(([method, total]) => {
      md += `| \`${method}\` | ${total} |\n`
    })
    return md
  }

  /**
   * Renders the top 5 messages for each console method in markdown, with file breakdowns.
   * @param {Object} counts - Map of "method:message" -> count.
   * @returns {string} Markdown sections for each method.
   */
  renderTopMessagesByMethod(counts) {
    const methodMessages = {}
    // Group messages by method
    Object.entries(counts).forEach(([key, count]) => {
      const [method, ...rest] = key.split(':')
      const message = rest.join(':').trim() || '<empty>'
      if (!methodMessages[method]) methodMessages[method] = []
      methodMessages[method].push({ message, count, key })
    })
    // Access files mapping from the aggregate file
    const filesMap = this.readAggregate().files || {}
    let md = ''
    // For each method, render a table of top 5 messages, with file breakdowns
    Object.entries(methodMessages).forEach(([method, messages]) => {
      if (!messages.length) {
        return
      }
      md += `\n## Top 5 \`${method}\` calls by message\n\n`
      messages
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .forEach((message) => (md += this.renderMessage(message, filesMap)))
    })
    return md
  }

  /**
   * Renders a single message entry with file breakdowns for markdown.
   * @param {Object} messageObj - { message, count, key }
   * @param {Object} filesMap - Map of "method:message" -> { filePath: count }
   * @returns {string} Markdown string for the message and its files.
   */
  renderMessage({ message, count, key }, filesMap) {
    const safeMsg = message.replace(/\|/g, '\\|') // Escape pipe for markdown
    let msgMd = `- (${count}) ${safeMsg}\n`
    // Add file breakdown for this message, if available
    const fileCounts = filesMap[key]
    // Sort files by count descending
    const sortedFiles = Object.entries(fileCounts).sort((a, b) => b[1] - a[1])

    // Limit to top 5 files
    let showFiles
    if (sortedFiles.length > MAX_FILES + 1) {
      showFiles = sortedFiles.slice(0, MAX_FILES)
    } else {
      showFiles = sortedFiles
    }
    showFiles.forEach(([file, fileCount]) => {
      msgMd += `  - (${fileCount}) \`${file}\`\n`
    })
    if (showFiles.length < sortedFiles.length) {
      const remainingCount = sortedFiles.length - showFiles.length
      msgMd += `  - + ${remainingCount} more file${
        remainingCount > 1 ? 's' : ''
      }\n`
    }
    return msgMd
  }
}

module.exports = ConsoleCountReporter
