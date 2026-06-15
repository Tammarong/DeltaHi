# Get employee data

## Endpoint

`GET /api/user/employee/:empid`

## Path Parameters

| Parameter   | Type   | Required | Default    | Description             |
| ----------  | ------ | -------- | ---------- | ----------------------- |
| empid | string | `true`   | -  | Employee ID             |

## Query Parameters

| Parameter   | Type   | Required | Default    | Description             |
| ----------  | ------ | -------- | ---------- | ----------------------- |
| - | - | -   | -  | -             |

### Example Request

```http
GET /api/user/employee/86676767
```

## Response

### Success (200 OK)

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "company": "TH00",
    "emp_id": "86676767",
    "name": "Six",
    "name_th": "หก",
    "surname": "Seven",
    "surname_th": "เจ็ด",
    "factory_code": "DET05",
    "factory_name": "BP3",
    "location_code": "05",
    "location": "Bangpoo",
    "job_grade": "A7 ",
    "emp_type": "Monthly",
    "employment": "Hired",
    "begin_date": null,
    "seniority": 1.88,
    "birthday": null,
    "age": 26,
    "email": "six.seven@deltaww.com",
    "ad_account": "six.seven",
    "gender": "F",
    "job_code": "HR3H001",
    "job_name": "HRIS Officer",
    "nationality": "THAI",
    "resign_date": "",
    "full_name": "Six Seven",
    "full_name_th": "หก เจ็ด",
    "meta": {
      "dept_code": "S6614A001000",
      "dept_name": "SEA HRIS & Digital Transformation",
      "cost_code": "S6614A00",
      "cost_name": "SEA-HR",
      "MobileNo": ""
    }
  }
}
```