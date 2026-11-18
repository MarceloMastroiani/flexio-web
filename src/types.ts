export type Role = 'ADMIN' | 'STAFF'
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MERCADOPAGO'

export interface User {
  id: string
  email: string
  password?: string
  role: Role
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  firstVisitAt: string
  lastVisitAt?: string | null
}

export interface Service {
  id: string
  name: string
  price: number | string
}

export interface DayAvailability {
  mon?: { start: string; end: string }[]
  tue?: { start: string; end: string }[]
  wed?: { start: string; end: string }[]
  thu?: { start: string; end: string }[]
  fri?: { start: string; end: string }[]
  sat?: { start: string; end: string }[]
  sun?: { start: string; end: string }[]
}

export interface Employee {
  id: string
  name: string
  email?: string | null
  availability: DayAvailability | null
  slotMinutes: number
  userId?: string | null
}

export interface Appointment {
  id: string
  startsAt: string
  endsAt: string
  reminderSentAt?: string | null
  status: AppointmentStatus
  notes?: string | null
  customerId: string
  employeeId: string
  customer: Customer
  employee: Employee
  serviceId?: string | null
  service?: Service | null
}

export interface Payment {
  id: string
  amount: number | string
  method: PaymentMethod
  notes?: string | null
  paidAt: string
  appointmentId: string
  appointment?: Appointment | null
}

export interface AvailableSlot {
  start: string
  end: string
}

export interface AuthUser {
  userId: string
  email: string
  role: Role
}
