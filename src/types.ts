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

export interface PagedAppointments {
  items: Appointment[]
  total: number
  page: number
  pageSize: number
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

export interface PublicAppointmentItem {
  id: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  employeeName: string
  cancellable: boolean
}

export interface AuthUser {
  userId: string
  email: string
  role: Role
}

// ── Reportes ────────────────────────────────────────────────────────────────

export type Granularity = 'day' | 'week' | 'month'
export type OrderBy = 'count' | 'revenue'

export interface ReportMeta {
  from: string
  to: string
  timezone: string
  granularity?: string
  generatedAt: string
  comparison?: { from: string; to: string }
}

export interface ReportResponse<T> {
  meta: ReportMeta
  data: T
}

export interface Delta {
  value: number
  previous: number
  changePct: number | null
}

export type SummaryMetric = Delta | number

export interface RevenuePoint {
  date: string
  total: number
  count: number
}

export interface RevenueMethod {
  method: string
  total: number
  count: number
  sharePct: number | null
}

export interface RevenueData {
  total: number
  paymentsCount: number
  averageTicket: number
  series: RevenuePoint[]
  byMethod: RevenueMethod[]
}

export interface AppointmentsStatus {
  PENDING: number
  CONFIRMED: number
  COMPLETED: number
  CANCELLED: number
}

export interface AppointmentsPoint {
  date: string
  total: number
  completed: number
  cancelled: number
}

export interface AppointmentsData {
  total: number
  byStatus: AppointmentsStatus
  completionRatePct: number | null
  cancellationRatePct: number | null
  extendedCount: number
  series: AppointmentsPoint[]
}

export interface HeatmapBusiestSlot {
  weekday: number
  hour: number
  count: number
}

export interface HeatmapData {
  matrix: number[][]
  busiestSlot: HeatmapBusiestSlot | null
}

export interface TopServiceItem {
  serviceId: string
  name: string
  count: number
  revenue: number
  sharePct: number | null
}

export interface ServicesData {
  completedAppointments: number
  appointmentsWithServices: number
  appointmentsWithoutServices: number
  coveragePct: number | null
  services: TopServiceItem[]
}

export interface EmployeeReportItem {
  employeeId: string
  name: string
  appointments: { total: number; completed: number; cancelled: number }
  revenue: number
  extendedAppointments: number
  extendedSlotsTotal: number
  occupancyPct: number | null
}

export interface EmployeesData {
  employees: EmployeeReportItem[]
  occupancyPct: number | null
}

export interface CustomerSpendItem {
  customerId: string
  name: string
  visits: number
  totalSpent: number
}

export interface CustomersData {
  activeCustomers: number
  newCustomers: number
  returningCustomers: number
  topBySpend: CustomerSpendItem[]
  topByVisits: CustomerSpendItem[]
}

export interface InactiveCustomerItem {
  customerId: string
  name: string
  phone: string | null
  email: string | null
  lastVisitAt: string | null
}

export interface InactiveCustomersData {
  items: InactiveCustomerItem[]
  page: number
  pageSize: number
  total: number
}

export interface SummaryTopService {
  name: string
  count: number
}

export interface SummaryData {
  revenue: SummaryMetric
  paymentsCount: SummaryMetric
  averageTicket: SummaryMetric
  appointmentsTotal: SummaryMetric
  completionRatePct: SummaryMetric
  cancellationRatePct: SummaryMetric
  newCustomers: SummaryMetric | null
  topService: SummaryTopService | null
  occupancyPct: SummaryMetric | null
}
