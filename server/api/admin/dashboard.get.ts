import { getAdminDashboard } from '../../services/adminDashboardService'

function getQueryNumber(value: unknown) {
  const normalizedValue = Array.isArray(value) ? value[0] : value
  const parsedValue = Number.parseInt(String(normalizedValue ?? ''), 10)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function getQueryString(value: unknown) {
  const normalizedValue = Array.isArray(value) ? value[0] : value
  const stringValue = String(normalizedValue ?? '').trim()

  return stringValue || undefined
}

function getQueryOs(value: unknown) {
  const os = getQueryString(value)

  if (os === 'ios' || os === 'android' || os === 'unknown') {
    return os
  }

  return undefined
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return await getAdminDashboard({
    page: getQueryNumber(query.page),
    pageSize: getQueryNumber(query.pageSize),
    search: getQueryString(query.search),
    os: getQueryOs(query.os),
    dateFrom: getQueryString(query.dateFrom),
    dateTo: getQueryString(query.dateTo)
  })
})
