import { describe, expect, it } from 'vitest'
import { combinePatientAlertsMap, combineReminderAlerts } from './alerts'

describe('combineReminderAlerts', () => {
  it('sums treatment alerts and reminder alerts into a single shape', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()

    const result = combineReminderAlerts({ overdue: 1, upcoming: 0 }, [past, soon, null])

    expect(result).toEqual({ overdue: 2, upcoming: 1 })
  })

  it('returns the treatment alerts unchanged when there are no reminders', () => {
    expect(combineReminderAlerts({ overdue: 3, upcoming: 2 }, [])).toEqual({ overdue: 3, upcoming: 2 })
  })
})

describe('combinePatientAlertsMap', () => {
  it('groups overdue/upcoming counts per patient across both sources', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const result = combinePatientAlertsMap(
      [
        { patient_id: 'p1', due_at: past },
        { patient_id: 'p2', due_at: farFuture },
      ],
      [
        { patient_id: 'p1', due_at: soon },
        { patient_id: 'p3', due_at: past },
      ]
    )

    expect(result).toEqual({
      p1: { overdue: 1, upcoming: 1 },
      p3: { overdue: 1, upcoming: 0 },
    })
  })

  it('omits patients with only al_dia (or null) due dates', () => {
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const result = combinePatientAlertsMap([{ patient_id: 'p1', due_at: farFuture }], [
      { patient_id: 'p2', due_at: null },
    ])

    expect(result).toEqual({})
  })
})
