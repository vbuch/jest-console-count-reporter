# jest-console-count-reporter

A Jest custom reporter that tracks and aggregates console calls (`log`, `warn`, `error`, `info`, `debug`) across all test workers, providing colorized summaries and detailed breakdowns to help you monitor and optimize console usage in your tests.

## Features

- 🎯 **Comprehensive Tracking**: Monitors all console methods across all Jest test workers
- 🌈 **Colorized Output**: Beautiful, color-coded terminal summaries for easy reading
- 📊 **Detailed Breakdowns**: Shows console usage by method, message, and file
- 📄 **Markdown Reports**: Generates detailed markdown summaries in your coverage directory
- 🚀 **Zero Configuration**: Works out of the box with minimal setup
- 📈 **Performance Insights**: Identify which tests and files generate the most console output

## Requirements

- **Jest**: Version 24+ (uses `@jest/reporters`)
- **Node.js**: Version 12+ 

## Installation

### Dependencies

The reporter requires `@jest/reporters` to be available in your project:

```bash
npm install --save-dev @jest/reporters
```

### Option 1: Copy Files Directly

Clone or download the repository and copy the files to your project:

```bash
# Copy the reporter files to your project
cp path/to/jest-console-count-reporter/*.js your-project/jest-reporters/
```

### Option 2: Git Submodule

Add as a git submodule:

```bash
git submodule add https://github.com/vbuch/jest-console-count-reporter.git jest-reporters/console-count
```

## Configuration

### 1. Jest Configuration

Add the reporter to your Jest configuration in `jest.config.js` or `package.json`:

#### Using jest.config.js

```javascript
module.exports = {
  // ... your other Jest config
  reporters: [
    'default',
    '<rootDir>/path/to/reporter.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/path/to/setup.js'
  ]
}
```

#### Using package.json

```json
{
  "jest": {
    "reporters": [
      "default",
      "<rootDir>/path/to/reporter.js"
    ],
    "setupFilesAfterEnv": [
      "<rootDir>/path/to/setup.js"
    ]
  }
}
```

### 2. Required Files

Make sure both files are properly referenced in your Jest configuration:

- **`setup.js`**: Must be included in `setupFilesAfterEnv` to intercept console calls
- **`reporter.js`**: Must be included in `reporters` to generate the summary

## How It Works

The jest-console-count-reporter works by:

1. **Setup Phase**: The `setup.js` file intercepts all console methods and tracks usage
2. **Tracking**: Console calls are counted by method, message, and originating file
3. **Aggregation**: Data is written to a temporary file (`/tmp/jest-console-counts.json`) 
4. **Reporting**: The reporter reads the aggregate data and displays summaries

**Important**: The setup file must be included in `setupFilesAfterEnv` for the reporter to function correctly.

## Usage

Once configured, the reporter automatically tracks console usage during your test runs:

```bash
npm test
```

## Output Examples

### Terminal Output

The reporter provides a concise summary at the end of your test run:

```
[console-count] Console call summary:
  log: 8
  error: 5
  warn: 4
  debug: 2
  info: 3
  error: "Payment gateway timeout" - 1
  warn: "Retrying payment" - 1

Full summary available in /tmp/demo-project/coverage/console-count-summary.md
```

The terminal output shows:
- **Method totals**: Count of each console method used across all tests
- **Top messages**: The most recent or highest-count messages for some methods
- **Markdown location**: Path to the detailed markdown report (when generated)

### Markdown Report

When your tests generate console output from 5 or more files, a detailed markdown report is created at `coverage/console-count-summary.md`:

```markdown
## [console-count] Console call summary:

| Console Method | Total Count |
|---|---|
| `log` | 8 |
| `error` | 5 |
| `warn` | 4 |
| `debug` | 2 |
| `info` | 3 |

## Top 5 `error` calls by message

- (1) Payment gateway timeout
  - (1) `demo-project/payment.test.js`
- (1) Authentication failed
  - (1) `demo-project/api.test.js`
- (1) Validation error
  - (1) `demo-project/api.test.js`

## Top 5 `log` calls by message

- (1) Processing payment
  - (1) `demo-project/payment.test.js`
- (1) Tracking user event
  - (1) `demo-project/analytics.test.js`
```

The markdown report includes:
- **Summary table**: Total counts per console method
- **Top messages**: Up to 5 most frequent messages per method
- **File breakdown**: Which files generated each message and how many times

## Configuration Options

The reporter includes several configuration options that can be modified:

### Markdown Report Threshold

The markdown report is only generated when console calls come from 5 or more different files. This behavior is controlled in `reporter.js`:

```javascript
const shouldWriteMarkdown = allFiles.length >= 5
```

### MAX_FILES Display Limit

By default, the reporter shows up to 5 files per console message in the markdown report:

```javascript
const MAX_FILES = 5 // Maximum number of files to show in a single section
```

### Tracked Console Methods

The setup tracks these console methods by default:

```javascript
const methods = ['log', 'warn', 'error', 'info', 'debug']
```

### Color Customization

Colors are defined in `colorPrefix.js` and use ANSI color codes:

```javascript
// Current color scheme:
// error: red background, white text ('41;97')
// warn: yellow background, black text ('43;30') 
// info: cyan background, black text ('46;30')
// log: grey background, black text ('47;30')
```

## API Reference

### ConsoleCountReporter

The main reporter class that extends Jest's `BaseReporter`.

#### Methods

- `onRunStart()`: Clears any previous aggregate files
- `onRunComplete(contexts, results)`: Reads aggregate data and generates summaries
- `readAggregate()`: Reads console count data from the temporary file
- `logSummary(counts, files)`: Outputs colorized terminal summary
- `writeMarkdownSummary(counts, files, outputPath)`: Generates markdown report

### Setup Functions

The setup file provides console interception:

- `getCurrentTestFile()`: Determines the current test file for attribution
- `writeAggregate(data)`: Writes count data to the shared temporary file

## Advanced Usage

### Custom Aggregation

You can extend the reporter to customize how console calls are aggregated or displayed:

```javascript
class CustomConsoleReporter extends ConsoleCountReporter {
  logSummary(counts, files) {
    // Custom summary logic
    super.logSummary(counts, files)
    console.log('Custom summary information...')
  }
}
```

### Integration with CI/CD

The markdown reports can be integrated into your CI/CD pipeline:

```bash
# Example: Fail build if too many console calls
CONSOLE_COUNT=$(grep "Total Count" coverage/console-count-summary.md | awk '{sum += $4} END {print sum}')
if [ "$CONSOLE_COUNT" -gt 100 ]; then
  echo "Too many console calls: $CONSOLE_COUNT"
  exit 1
fi
```

## Troubleshooting

### No Output Displayed

- Ensure `setup.js` is included in `setupFilesAfterEnv`
- Verify that your tests actually use console methods
- Check that the reporter is listed in the `reporters` array

### Missing File Information  

- Confirm that `expect.getState()` is available in your Jest environment
- Ensure tests are running with proper Jest context

### Colors Not Showing

- Verify your terminal supports ANSI color codes
- Check if output is being redirected to a file

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test them
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [Jest](https://jestjs.io/) - JavaScript testing framework
- [@jest/reporters](https://github.com/facebook/jest/tree/main/packages/jest-reporters) - Built-in Jest reporters