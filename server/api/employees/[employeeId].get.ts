import { employeeIdSchema } from '../../../shared/schemas/referral'
import { findHrEmployeeByEmpId } from '../../repositories/referralRepository'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const parsedEmployeeId = employeeIdSchema.safeParse(getRouterParam(event, 'employeeId'))

  if (!parsedEmployeeId.success) {
    return { employee: null }
  }

  const employee = await findHrEmployeeByEmpId(prisma, parsedEmployeeId.data)

  if (!employee) {
    return { employee: null }
  }

  const displayName = [employee.name, employee.surname].filter(Boolean).join(' ').trim()

  return {
    employee: {
      empid: employee.empid,
      name: employee.name,
      surname: employee.surname,
      displayName: displayName || employee.empid
    }
  }
})
