import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..')
const configPath = join(ROOT, 'config', 'client.json')

if (!existsSync(configPath)) {
  console.error('config/client.json not found. Copy client.json.example and fill in values.')
  process.exit(1)
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'))

// Generate .env.local
const envLines = [
  `NEXT_PUBLIC_API_URL=${config.environment.API_URL}`,
  `NEXT_PUBLIC_APP_NAME=${config.branding.appName}`,
  `NEXT_PUBLIC_PRIMARY_COLOR=${config.branding.primaryColor}`,
]
writeFileSync(join(ROOT, '.env.local'), envLines.join('\n') + '\n')
console.log('[inject] .env.local generated')

// Generate features.json
const featuresDir = join(ROOT, 'src', 'config')
if (!existsSync(featuresDir)) mkdirSync(featuresDir, { recursive: true })

writeFileSync(
  join(featuresDir, 'features.json'),
  JSON.stringify(config.features, null, 2) + '\n'
)
console.log('[inject] src/config/features.json generated')

console.log('[inject] Done! Run `npm run dev` to start.')
