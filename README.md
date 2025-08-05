# jest-console-count-reporter

A Jest custom reporter that tracks and aggregates console calls (`log`, `warn`, `error`, `info`, `debug`) across all test workers, providing colorized summaries and detailed breakdowns to help you monitor and optimize console usage in your tests.

**Note**: This is a copy-based tool, not an npm package. Copy the files to your project rather than installing as a dependency.

## Features

- 🎯 **Comprehensive Tracking**: Monitors all console methods across all Jest test workers
- 🌈 **Colorized Output**: Beautiful, color-coded terminal summaries for easy reading
- 📊 **Detailed Breakdowns**: Shows console usage by method, message, and file
- 📄 **Markdown Reports**: Generates detailed markdown summaries in your coverage directory
- 🚀 **Zero Configuration**: Works out of the box with minimal setup
- 📈 **Performance Insights**: Identify which tests and files generate the most console output

## Quick Start

1. Copy `reporter.js`, `setup.js`, `colorCode.js`, and `colorPrefix.js` to your project

2. Update your Jest config:
   ```json
   {
     "reporters": ["default", "<rootDir>/path/to/reporter.js"],
     "setupFilesAfterEnv": ["<rootDir>/path/to/setup.js"]
   }
   ```

   Or via CLI:
   ```bash
   jest --reporters=default --reporters=<rootDir>/path/to/reporter.js
   ```

3. Run your tests:
   ```bash
   npm test
   ```

4. Check the output in console and potentially view the generated report under /coverage

## Requirements

- **Jest**: Version 24+ (requires `@jest/reporters` which is included with Jest)
- **Node.js**: Version 12+ 

## Installation

**This reporter is designed to be copied into your project, not installed as a dependency.**

### Copy Files Directly

Clone or download the repository and copy the files to your project:

```bash
# Copy the reporter files to your project
cp path/to/jest-console-count-reporter/*.js your-project/jest-reporters/
```

### Alternative: Git Submodule

Add as a git submodule if you prefer to track updates:

```bash
git submodule add https://github.com/vbuch/jest-console-count-reporter.git jest-reporters/console-count
```

### Files Included

The reporter consists of four files that work together:

- **`reporter.js`**: Main Jest reporter class (required)
- **`setup.js`**: Console interception setup (required)
- **`colorCode.js`**: ANSI color utility (required)
- **`colorPrefix.js`**: Color formatting helper (required)

All four files must be available in your project for the reporter to function correctly.

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

**Note**: The temporary aggregate file is automatically cleaned up at the start of each test run.

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
  top error: "Payment gateway timeout" - 1
  top warn: "Retrying payment" - 1

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

### Missing Dependency Error

If you see `Cannot find module '@jest/reporters'`, this indicates an issue with your Jest installation. The `@jest/reporters` package is included with Jest itself:

```bash
# Ensure Jest is properly installed
npm install --save-dev jest

# For newer Jest versions, @jest/reporters is included automatically
# For older versions, you may need to install it separately
npm install --save-dev @jest/reporters
```

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