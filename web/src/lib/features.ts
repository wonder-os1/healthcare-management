type FeatureKey =
  | 'telemedicine'
  | 'labIntegration'
  | 'smsNotifications'
  | 'whatsappAutomation'
  | 'aiChatbot'
  | 'advancedAnalytics'

let features: Record<string, boolean> = {}

try {
  features = require('@/config/features.json')
} catch {
  // features.json not generated yet — all features disabled by default
}

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return features[feature] === true
}

export { features }
