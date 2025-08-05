// Helper to colorize method prefixes and counts for console summary
const colorCode = require('./colorCode')

function colorPrefix(method, key, count) {
  let color = ''
  switch (method) {
    case 'error':
      color = '41;97'
      break // red bg, white text
    case 'warn':
      color = '43;30'
      break // yellow bg, black text
    case 'info':
      color = '46;30'
      break // cyan bg, black text
    case 'log':
      color = '47;30'
      break // grey bg, black text
    default:
      color = ''
  }
  const prefix = key.split(':')[0] + ':'
  const suffix = key.slice(prefix.length)

  let msg = `  ${colorCode(color, prefix)}${suffix}`
  if (count) {
    msg += ` - ${colorCode('47;30', ` ${count} `)}`
  }
  return msg
}

module.exports = colorPrefix
