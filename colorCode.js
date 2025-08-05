// Utility to wrap text in ANSI color codes for terminal output
// Usage: colorCode('41;97', 'Error!') // red background, white text
// The first argument is an ANSI SGR parameter string, e.g. '41;97' (background;color)
// See: https://en.wikipedia.org/wiki/ANSI_escape_code#Colors

function colorCode(color, text) {
  if (!color) return text
  return `\x1b[${color}m${text}\x1b[0m`
}

module.exports = colorCode
