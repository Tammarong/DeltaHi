import { getAdminDashboard } from '../../services/adminDashboardService'

function getQueryNumber(value: unknown) {
  const normalizedValue = Array.isArray(value) ? value[0] : value
  const parsedValue = Number.parseInt(String(normalizedValue ?? ''), 10)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return await getAdminDashboard({
    page: getQueryNumber(query.page),
    pageSize: getQueryNumber(query.pageSize)
  })
})
