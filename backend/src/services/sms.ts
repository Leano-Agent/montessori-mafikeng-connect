import axios from 'axios'

// Africa's Talking API configuration
interface SMSConfig {
  apiKey: string
  username: string
  senderId?: string
  enabled: boolean
}

let smsConfig: SMSConfig | null = null

// Initialize SMS service
export const initializeSMS = async () => {
  try {
    const apiKey = process.env.AFRICAS_TALKING_API_KEY
    const username = process.env.AFRICAS_TALKING_USERNAME
    const senderId = process.env.AFRICAS_TALKING_SENDER_ID || 'MONTESSORI'
    const enabled = process.env.SMS_ENABLED === 'true'

    if (!apiKey || !username) {
      console.warn('⚠️ Africa\'s Talking API credentials not found. SMS service disabled.')
      smsConfig = { apiKey: '', username: '', enabled: false }
      return
    }

    smsConfig = {
      apiKey,
      username,
      senderId,
      enabled,
    }

    console.log('✅ SMS service initialized')
    if (!enabled) {
      console.log('⚠️ SMS service is disabled (SMS_ENABLED=false)')
    }
  } catch (error) {
    console.error('❌ Failed to initialize SMS service:', error)
    smsConfig = { apiKey: '', username: '', enabled: false }
  }
}

// Send SMS
export const sendSMS = async (
  phoneNumber: string,
  message: string,
  options: {
    enqueueIfOffline?: boolean
    priority?: 'low' | 'normal' | 'high'
  } = {}
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> => {
  try {
    // Check if SMS is enabled
    if (!smsConfig?.enabled) {
      console.log('📱 SMS disabled, message would have been sent to:', phoneNumber)
      return {
        success: true,
        messageId: 'simulated',
      }
    }

    // Validate phone number (South African format)
    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    if (!normalizedPhone) {
      throw new Error(`Invalid phone number: ${phoneNumber}`)
    }

    // Validate message length
    if (message.length > 160) {
      console.warn('⚠️ SMS message exceeds 160 characters, will be split')
    }

    // Prepare request to Africa's Talking API
    const response = await axios.post(
      'https://api.africastalking.com/version1/messaging',
      new URLSearchParams({
        username: smsConfig.username,
        to: normalizedPhone,
        message: message,
        from: smsConfig.senderId!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': smsConfig.apiKey,
          'Accept': 'application/json',
        },
      }
    )

    const result = response.data

    if (result.SMSMessageData.Recipients[0].statusCode === 101) {
      console.log(`✅ SMS sent to ${normalizedPhone}: ${message.substring(0, 50)}...`)
      return {
        success: true,
        messageId: result.SMSMessageData.Recipients[0].messageId,
      }
    } else {
      throw new Error(`SMS failed: ${result.SMSMessageData.Recipients[0].status}`)
    }
  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error.message)

    // If enqueueIfOffline is true, store in database for retry
    if (options.enqueueIfOffline) {
      try {
        // TODO: Store in sync queue for retry
        console.log('📦 SMS queued for retry:', phoneNumber)
      } catch (queueError) {
        console.error('Failed to queue SMS:', queueError)
      }
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

// Send bulk SMS
export const sendBulkSMS = async (
  phoneNumbers: string[],
  message: string,
  options: {
    batchSize?: number
    delayBetweenBatches?: number
  } = {}
): Promise<{
  success: boolean
  sent: number
  failed: number
  details: Array<{ phone: string; success: boolean; error?: string }>
}> => {
  const batchSize = options.batchSize || 10
  const delay = options.delayBetweenBatches || 1000
  const results = []

  // Process in batches to avoid rate limiting
  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    const batch = phoneNumbers.slice(i, i + batchSize)
    const batchPromises = batch.map(phone => sendSMS(phone, message))

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults.map((result, index) => ({
      phone: batch[index],
      success: result.success,
      error: result.error,
    })))

    // Delay between batches to avoid rate limiting
    if (i + batchSize < phoneNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return {
    success: failed === 0,
    sent,
    failed,
    details: results,
  }
}

// Send SMS with Setswana/English language detection
export const sendLocalizedSMS = async (
  phoneNumber: string,
  englishMessage: string,
  setswanaMessage: string,
  userLanguage?: 'SETSWANA' | 'ENGLISH'
): Promise<{
  success: boolean
  messageId?: string
  languageUsed?: string
}> => {
  const language = userLanguage || 'SETSWANA' // Default to Setswana for African context
  const message = language === 'SETSWANA' ? setswanaMessage : englishMessage

  const result = await sendSMS(phoneNumber, message)

  return {
    ...result,
    languageUsed: language,
  }
}

// Send emergency/priority SMS (bypasses disabled flag)
export const sendEmergencySMS = async (
  phoneNumber: string,
  message: string
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> => {
  // Force enable SMS for emergencies
  const originalEnabled = smsConfig?.enabled
  if (smsConfig) {
    smsConfig.enabled = true
  }

  try {
    const result = await sendSMS(phoneNumber, message, { priority: 'high' })
    return result
  } finally {
    // Restore original setting
    if (smsConfig) {
      smsConfig.enabled = originalEnabled || false
    }
  }
}

// Normalize phone number to international format
const normalizePhoneNumber = (phone: string): string | null => {
  if (!phone) return null

  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '')

  // Handle South African numbers
  if (normalized.startsWith('0')) {
    // Convert 0XXXXXXXXX to +27XXXXXXXXX
    normalized = '27' + normalized.substring(1)
  } else if (normalized.startsWith('27') && normalized.length === 11) {
    // Already in +27 format
    normalized = normalized
  } else if (normalized.startsWith('+')) {
    // Remove leading +
    normalized = normalized.substring(1)
  }

  // Validate length (South African numbers are 11 digits with country code)
  if (normalized.length !== 11 || !normalized.startsWith('27')) {
    console.warn(`⚠️ Phone number may not be valid South African: ${phone} -> ${normalized}`)
  }

  return normalized
}

// Check SMS balance
export const checkSMSBalance = async (): Promise<{
  success: boolean
  balance?: string
  currency?: string
  error?: string
}> => {
  try {
    if (!smsConfig?.apiKey || !smsConfig?.username) {
      throw new Error('SMS service not configured')
    }

    const response = await axios.get(
      `https://api.africastalking.com/version1/user`,
      {
        params: {
          username: smsConfig.username,
        },
        headers: {
          'apiKey': smsConfig.apiKey,
          'Accept': 'application/json',
        },
      }
    )

    const result = response.data
    return {
      success: true,
      balance: result.UserData.balance,
      currency: result.UserData.currency.code,
    }
  } catch (error: any) {
    console.error('❌ Failed to check SMS balance:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}

// SMS utilities
export const smsUtils = {
  // Format message for SMS (truncate, add signature)
  formatMessage: (message: string, signature: string = 'Montessori Mafikeng'): string => {
    const maxLength = 160 - signature.length - 5 // Reserve space for signature and ellipsis
    
    if (message.length > maxLength) {
      return message.substring(0, maxLength - 3) + '... - ' + signature
    }
    
    return message + ' - ' + signature
  },

  // Extract phone numbers from user records
  extractPhoneNumbers: (users: Array<{ phone?: string }>): string[] => {
    return users
      .map(user => user.phone)
      .filter(Boolean)
      .map(phone => phone!.trim())
  },

  // Validate phone number format
  isValidPhoneNumber: (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone)
    return !!normalized && normalized.length >= 10
  },
}

// Export SMS config
export { smsConfig }