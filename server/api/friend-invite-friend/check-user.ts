import { employeeIdSchema } from "../../../shared/schemas/referral";
import { findHrEmployeeByEmpId } from "../../repositories/referralRepository";
import { prisma } from "../../utils/prisma";
import { getEmployeeDisplayName } from "../../utils/referral";

type CheckUserRequestBody = {
  employee_id?: unknown;
  employeeId?: unknown;
};

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toNullableString(value: string | null | undefined) {
  return value?.trim() || null;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const body =
    event.method === "GET"
      ? {}
      : await readBody<CheckUserRequestBody>(event).catch(() => ({}));
  const rawEmployeeId =
    firstQueryValue(query.employee_id ?? query.employeeId) ??
    body.employee_id ??
    body.employeeId;
  const parsedEmployeeId = employeeIdSchema.safeParse(rawEmployeeId);

  if (!parsedEmployeeId.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsedEmployeeId.error.issues[0]?.message || "Employee ID is required.",
    });
  }

  const [user, employee] = await Promise.all([
    prisma.serviceUser.findFirst({
      where: {
        employeeId: parsedEmployeeId.data,
      },
    }),
    findHrEmployeeByEmpId(prisma, parsedEmployeeId.data),
  ]);

  if (!user || !employee) {
    throw createError({
      statusCode: 404,
      statusMessage: "User was not found.",
    });
  }

  const displayName = getEmployeeDisplayName(employee);

  return {
    status: 200,
    message: "Success",
    data: {
      id: user.id,
      created_at: null,
      updated_at: null,
      deleted_at: null,
      last_active: null,
      employee_id: user.employeeId,
      point_balance: 0,
      location_id: null,
      site_id: null,
      email: null,
      username: user.employeeId,
      avatar: null,
      avatar_frames: [],
      location: null,
      site: null,
      teams: [],
      employee_info: {
        company: null,
        emp_id: employee.empid,
        name: toNullableString(employee.name),
        name_th: null,
        surname: toNullableString(employee.surname),
        surname_th: null,
        factory_code: null,
        factory_name: null,
        location_code: null,
        location: null,
        job_grade: null,
        emp_type: null,
        employment: null,
        begin_date: null,
        seniority: null,
        birthday: null,
        age: null,
        email: null,
        ad_account: null,
        gender: null,
        job_code: null,
        job_name: null,
        nationality: null,
        resign_date: "",
        full_name: displayName,
        full_name_th: null,
        meta: {
          dept_code: null,
          dept_name: null,
          cost_code: null,
          cost_name: null,
          MobileNo: "",
        },
      },
      type_account: "user",
    },
  };
});
