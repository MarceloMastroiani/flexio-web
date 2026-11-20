import { api } from './api'
import type { PublicAppointmentItem } from '../types'

export interface PublicAppointmentsResponse {
  items: PublicAppointmentItem[]
}

export function lookupAppointments(phone: string) {
  return api.get<PublicAppointmentsResponse>(
    `/public/appointments?phone=${encodeURIComponent(phone)}`,
    false,
  )
}

export function cancelAppointment(id: string, phone: string) {
  return api.post<{ id: string; status: string }>(
    `/public/appointments/${id}/cancel`,
    { phone },
    false,
  )
}
