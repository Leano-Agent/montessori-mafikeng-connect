/**
 * Unit tests for SMS service
 *
 * Tests: sendSMS with Africa's Talking API, simulated mode, error handling.
 * Note: normalizePhoneNumber is a local function — tested indirectly via sendSMS.
 */

import axios from 'axios'

jest.mock('axios')

const mockAxios = axios as jest.Mocked<typeof axios>

beforeEach(() => {
  jest.clearAllMocks()
  process.env.AFRICAS_TALKING_API_KEY = 'test-api-key'
  process.env.AFRICAS_TALKING_USERNAME = 'test-username'
  process.env.AFRICAS_TALKING_SENDER_ID = 'MONTESSORI'
  process.env.SMS_ENABLED = 'true'
})

// ══════════════════════════════════════════════════════════════════════
// SEND SMS
// ══════════════════════════════════════════════════════════════════════
describe('sendSMS', () => {
  it('should send SMS via Africa\'s Talking API', async () => {
    mockAxios.post.mockResolvedValue({
      data: {
        SMSMessageData: {
          Recipients: [{ statusCode: 101, messageId: 'msg-123', status: 'Success' }],
        },
      },
    })

    // Need to re-import after mock is set — the service has already been initialized
    // So we dynamically import to get the latest module state
    const { sendSMS, initializeSMS } = await import('../services/sms')
    await initializeSMS() // Re-init with mock config

    const result = await sendSMS('+27821234567', 'Test message')

    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/messaging'),
      expect.any(URLSearchParams),
      expect.objectContaining({
        headers: expect.objectContaining({ apiKey: 'test-api-key' }),
      })
    )
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('msg-123')
  })

  it('should return simulated response when SMS is disabled', async () => {
    process.env.SMS_ENABLED = 'false'
    const { sendSMS, initializeSMS } = await import('../services/sms')
    await initializeSMS()

    const result = await sendSMS('+27821234567', 'Test message')

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('simulated')
    expect(mockAxios.post).not.toHaveBeenCalled()
  })

  it('should handle API failures gracefully', async () => {
    mockAxios.post.mockRejectedValue(new Error('Network error'))
    const { sendSMS, initializeSMS } = await import('../services/sms')
    await initializeSMS()

    const result = await sendSMS('+27821234567', 'Test message')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('should handle empty phone numbers', async () => {
    const { sendSMS, initializeSMS } = await import('../services/sms')
    await initializeSMS()

    const result = await sendSMS('', 'Test message')

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should warn on messages exceeding 160 chars', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    mockAxios.post.mockResolvedValue({
      data: {
        SMSMessageData: {
          Recipients: [{ statusCode: 101, messageId: 'msg-long', status: 'Success' }],
        },
      },
    })
    const { sendSMS, initializeSMS } = await import('../services/sms')
    await initializeSMS()

    const longMessage = 'A'.repeat(161)
    await sendSMS('+27821234567', longMessage)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('160')
    )
    consoleSpy.mockRestore()
  })
})

// ══════════════════════════════════════════════════════════════════════
// SMS UTILS
// ══════════════════════════════════════════════════════════════════════
describe('smsUtils', () => {
  let smsUtils: typeof import('../services/sms').smsUtils

  beforeAll(async () => {
    const mod = await import('../services/sms')
    smsUtils = mod.smsUtils
  })

  describe('formatMessage', () => {
    it('should append signature to short messages', () => {
      const result = smsUtils.formatMessage('Hello')
      expect(result).toContain('Hello')
      expect(result).toContain('Montessori Mafikeng')
    })

    it('should truncate long messages with signature', () => {
      const long = 'A'.repeat(200)
      const result = smsUtils.formatMessage(long)
      expect(result.length).toBeLessThanOrEqual(160)
      expect(result).toContain('...')
      expect(result).toContain('Montessori Mafikeng')
    })
  })

  describe('isValidPhoneNumber', () => {
    it('should validate SA phone numbers', () => {
      expect(smsUtils.isValidPhoneNumber('0821234567')).toBe(true)
      expect(smsUtils.isValidPhoneNumber('+27821234567')).toBe(true)
    })

    it('should reject empty strings', () => {
      expect(smsUtils.isValidPhoneNumber('')).toBe(false)
    })

    it('should reject very short numbers', () => {
      expect(smsUtils.isValidPhoneNumber('123')).toBe(false)
    })
  })

  describe('extractPhoneNumbers', () => {
    it('should extract phone numbers from user records', () => {
      const users = [
        { phone: '+27821234567' },
        { phone: '0829876543' },
        { phone: undefined },
        { phone: '' },
      ]
      const result = smsUtils.extractPhoneNumbers(users)
      expect(result).toHaveLength(2)
    })
  })
})
