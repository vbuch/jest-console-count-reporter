// Jest setup file to count and aggregate all console calls in each test worker.
// This enables a global summary of console usage across all test files.

const fs = require('fs')
const path = require('path')
const os = require('os')

// Path to the shared aggregate file in the OS temp directory
const AGGREGATE_PATH = path.join(os.tmpdir(), 'jest-console-counts.json')

// Track total and per-file console call counts
const globalConsoleCounts = {} // { key: totalCount }
const fileConsoleCounts = {} // { key: { [filename]: count } }
const origConsole = {}
const methods = ['log', 'warn', 'error', 'info', 'debug']

/**
 * Only replace console methods with counting versions when the reporter is in use.
 * This avoids messing up the traces of console calls during normal test runs.
 */
if (process.env.CONSOLE_COUNT_REPORTER_ENABLED) {
  patchConsoleForCounting()
  afterAll(aggregateConsoleCounts)
}

/**
 * Returns the last two path segments of the current test file for disambiguation.
 * Falls back to '<unknown>' if not available.
 */
function getCurrentTestFile() {
  try {
    if (typeof expect === 'undefined' || !expect.getState) {
      return '<unknown>'
    }

    const testPath = expect.getState().testPath
    if (!testPath) {
      return '<unknown>'
    }

    const parts = testPath.split(path.sep)
    if (parts.length < 2) {
      return parts[0]
    }

    return parts.slice(-2).join('/')
  } catch {
    return '<unknown>'
  }
}

/**
 * Encapsulate console patching in a function and call it
 */
function patchConsoleForCounting() {
  // Patch each console method to count calls and forward to the original
  methods.forEach((method) => {
    origConsole[method] = console[method]
    console[method] = (...args) => {
      const key = args.length > 0 ? String(args[0]).split('\n')[0] : '<empty>'
      const countKey = `${method}: ${key}`
      globalConsoleCounts[countKey] = (globalConsoleCounts[countKey] || 0) + 1

      // Per-file
      const file = getCurrentTestFile()
      if (!fileConsoleCounts[countKey]) fileConsoleCounts[countKey] = {}
      fileConsoleCounts[countKey][file] =
        (fileConsoleCounts[countKey][file] || 0) + 1
      origConsole[method].apply(console, args)
    }
  })
}

/**
 * After all tests in this worker, merge counts into the aggregate file
 */
function aggregateConsoleCounts() {
  let allCounts = {}
  let allFiles = {}
  try {
    if (fs.existsSync(AGGREGATE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(AGGREGATE_PATH, 'utf8'))
      allCounts = parsed.counts || {}
      allFiles = parsed.files || {}
    }
  } catch {}

  for (const key in globalConsoleCounts) {
    allCounts[key] = (allCounts[key] || 0) + globalConsoleCounts[key]
  }

  for (const key in fileConsoleCounts) {
    if (!allFiles[key]) allFiles[key] = {}
    for (const file in fileConsoleCounts[key]) {
      allFiles[key][file] =
        (allFiles[key][file] || 0) + fileConsoleCounts[key][file]
    }
  }

  try {
    fs.writeFileSync(
      AGGREGATE_PATH,
      JSON.stringify({ counts: allCounts, files: allFiles }),
      'utf8'
    )
  } catch {}
}
