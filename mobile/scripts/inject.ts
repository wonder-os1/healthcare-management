import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..')
const configPath = join(ROOT, 'config', 'client.json')

if (!existsSync(configPath)) {
  console.error('config/client.json not found. Copy client.json.example and fill in values.')
  process.exit(1)
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'))

// Update app.json branding
const appJsonPath = join(ROOT, 'app.json')
const appJson = JSON.parse(readFileSync(appJsonPath, 'utf-8'))
appJson.expo.name = config.branding.appName
appJson.expo.splash.backgroundColor = config.branding.primaryColor
writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n')
console.log('[inject] app.json updated with branding')

// Generate .env
const envLines = [`API_URL=${config.environment.API_URL}`]
writeFileSync(join(ROOT, '.env'), envLines.join('\n') + '\n')
console.log('[inject] .env generated')

// Generate features.json
writeFileSync(
  join(ROOT, 'lib', 'features.json'),
  JSON.stringify(config.features, null, 2) + '\n'
)
console.log('[inject] lib/features.json generated')

// Update tailwind primary color
const twConfigPath = join(ROOT, 'tailwind.config.js')
let twConfig = readFileSync(twConfigPath, 'utf-8')
twConfig = twConfig.replace(
  /primary: '[^']+'/,
  `primary: '${config.branding.primaryColor}'`
)
writeFileSync(twConfigPath, twConfig)
console.log('[inject] tailwind.config.js updated')

console.log('[inject] Done!')
