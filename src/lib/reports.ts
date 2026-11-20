import { api } from './api'
import type {
  AppointmentsData,
  CustomersData,
  EmployeesData,
  Granularity,
  HeatmapData,
  InactiveCustomersData,
  OrderBy,
  ReportResponse,
  RevenueData,
  ServicesData,
  SummaryData,
} from '../types'

interface RangeQuery {
  from: string
  to: string
}
interface SeriesQuery extends RangeQuery {
  granularity?: Granularity
}
interface TopQuery extends RangeQuery {
  limit?: number
  orderBy?: OrderBy
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return search.toString()
}

export const reportsApi = {
  summary: (q: RangeQuery & { compare?: boolean }) =>
    api.get<ReportResponse<SummaryData>>(
      `/reports/summary?${qs({ from: q.from, to: q.to, compare: q.compare })}`,
    ),

  revenue: (q: SeriesQuery) =>
    api.get<ReportResponse<RevenueData>>(
      `/reports/revenue?${qs({ from: q.from, to: q.to, granularity: q.granularity })}`,
    ),

  appointments: (q: SeriesQuery) =>
    api.get<ReportResponse<AppointmentsData>>(
      `/reports/appointments?${qs({ from: q.from, to: q.to, granularity: q.granularity })}`,
    ),

  heatmap: (q: RangeQuery) =>
    api.get<ReportResponse<HeatmapData>>(
      `/reports/appointments/heatmap?${qs({ from: q.from, to: q.to })}`,
    ),

  servicesTop: (q: TopQuery) =>
    api.get<ReportResponse<ServicesData>>(
      `/reports/services/top?${qs({ from: q.from, to: q.to, limit: q.limit, orderBy: q.orderBy })}`,
    ),

  employees: (q: RangeQuery) =>
    api.get<ReportResponse<EmployeesData>>(
      `/reports/employees?${qs({ from: q.from, to: q.to })}`,
    ),

  customers: (q: TopQuery) =>
    api.get<ReportResponse<CustomersData>>(
      `/reports/customers?${qs({ from: q.from, to: q.to, limit: q.limit })}`,
    ),

  customersInactive: (q: { days?: number; page?: number; pageSize?: number }) =>
    api.get<ReportResponse<InactiveCustomersData>>(
      `/reports/customers/inactive?${qs({ days: q.days, page: q.page, pageSize: q.pageSize })}`,
    ),
}

export function revenueCsvPath(q: SeriesQuery): string {
  return `/reports/revenue?${qs({ from: q.from, to: q.to, granularity: q.granularity, format: 'csv' })}`
}

export function appointmentsCsvPath(q: SeriesQuery): string {
  return `/reports/appointments?${qs({ from: q.from, to: q.to, granularity: q.granularity, format: 'csv' })}`
}

export async function downloadCsv(
  path: string,
  filename: string,
  token: string | null,
): Promise<void> {
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error(res.status === 403 ? 'Requiere permisos de administrador' : `Error ${res.status}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
