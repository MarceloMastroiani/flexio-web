import { describe, expect, it } from 'vitest'
import {
  formatDateLong,
  formatDateShort,
  isSameDay,
  parseDateValue,
} from './format'

describe('parseDateValue', () => {
  it('interpreta YYYY-MM-DD como fecha local (sin shift UTC)', () => {
    const d = parseDateValue('2026-11-20')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(20)
  })

  it('parsea un ISO completo como instante absoluto', () => {
    expect(parseDateValue('2026-11-20T17:00:00.000Z').toISOString()).toBe(
      '2026-11-20T17:00:00.000Z',
    )
  })
})

describe('formatDateLong / formatDateShort', () => {
  it('no corren un día la fecha date-only (2026-11-20 sigue siendo 20)', () => {
    expect(formatDateLong('2026-11-20')).toContain('20')
    expect(formatDateLong('2026-11-20')).not.toContain('19')
    expect(formatDateShort('2026-11-20')).toContain('20')
    expect(formatDateShort('2026-11-20')).not.toContain('19')
  })

  it('muestran el día correcto de un ISO completo', () => {
    const local = new Date(2026, 10, 20, 14, 0, 0)
    expect(formatDateLong(local.toISOString())).toContain('20')
  })
})

describe('isSameDay', () => {
  it('compara una fecha date-only con su día local', () => {
    expect(isSameDay('2026-11-20', new Date(2026, 10, 20, 12))).toBe(true)
    expect(isSameDay('2026-11-20', new Date(2026, 10, 21, 12))).toBe(false)
  })
})
