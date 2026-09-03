import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.fn()

vi.mock('@/server/supabase-service-role', () => ({
  createServiceRoleClient: () => ({ rpc: rpcMock }),
}))

vi.mock('@/lib/email/client', () => ({
  sendEmail: vi.fn(),
}))

describe('GET /api/cron/patient-reminders', () => {
  beforeEach(() => {
    rpcMock.mockReset()
    process.env.CRON_SECRET = 'test-secret'
  })

  it('returns 401 and never calls the RPC when the bearer token is missing or wrong', async () => {
    const { GET } = await import('./route')

    const response = await GET(
      new Request('http://localhost/api/cron/patient-reminders', {
        headers: { authorization: 'Bearer wrong-secret' },
      })
    )

    expect(response.status).toBe(401)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('calls the RPC and returns ok when the bearer token matches CRON_SECRET', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })
    const { GET } = await import('./route')

    const response = await GET(
      new Request('http://localhost/api/cron/patient-reminders', {
        headers: { authorization: 'Bearer test-secret' },
      })
    )

    expect(response.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith('enqueue_patient_reminders')
  })
})
