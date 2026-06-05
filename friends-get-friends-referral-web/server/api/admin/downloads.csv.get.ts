import { setHeader } from 'h3'
import { getAdminDownloadsCsv } from '../../services/adminDashboardService'

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
  const csv = await getAdminDownloadsCsv({
    search: getQueryString(query.search),
    os: getQueryOs(query.os),
    dateFrom: getQueryString(query.dateFrom),
    dateTo: getQueryString(query.dateTo)
  })

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="downloads.csv"')

  return csv
})
