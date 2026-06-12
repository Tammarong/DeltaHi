# Check User Already Login

คำอธิบายสั้น ๆ ของ API นี้

## Endpoint

`POST /api/friend-invite-friend/check-user`

## Query Parameters

| Parameter   | Type   | Required | Default    | Description             |
| ----------  | ------ | -------- | ---------- | ----------------------- |
| employee_id | string | `true`   |            | Employee ID             |

### Example Request

```http
GET /api/friend-invite-friend/check-user?employee_id=86676767
```

## Response

### Success (200 OK)

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": "F8BE1C16-4E36-406D-9F56-54DD32F007E0",
    "created_at": "2025-09-30T09:05:10.450+00:00",
    "updated_at": "2026-06-10T09:28:28.171+00:00",
    "deleted_at": null,
    "last_active": "2026-06-10T09:28:28.169+00:00",
    "employee_id": "86676767",
    "location_id": "E22C94B1-9AF7-46FC-BC28-83C9F7D47BD3",
    "site_id": "296FA937-7DFD-47C3-A811-629B4CC31038",
    "email": null,
    "username": "86676767",
    "avatar": {
      "id": "8E30EB3A-8334-492C-9549-B624C5AD383E",
      "employee_id": "86676767",
      "avatar": "/jh31dna3vjiyob6gla9i8inf.jpg",
      "original_avatar": null,
      "created_at": "2025-09-30T09:50:59.373+00:00",
      "updated_at": "2026-02-16T06:54:49.363+00:00",
      "deleted_at": null,
      "created_by_id": "F8BE1C16-4E36-406D-9F56-54DD32F007E0",
      "updated_by_id": "F8BE1C16-4E36-406D-9F56-54DD32F007E0",
      "deleted_by_id": null
    },
    "avatar_frames": [
      {
        "id": "B37152F1-18CB-46B0-9378-CE66FDD13333",
        "created_at": "2026-02-16T03:50:19.396+00:00",
        "updated_at": "2026-02-16T06:43:40.290+00:00",
        "deleted_at": null,
        "created_by_id": "2D32118B-5E2B-4DB6-9944-1F3FA14B42DC",
        "updated_by_id": "2D32118B-5E2B-4DB6-9944-1F3FA14B42DC",
        "deleted_by_id": null,
        "name": {
          "en": "🍊 Lucky Lunar New Year 2026 🧧",
          "th": "🍊 สุขสันต์วันตรุษจีน 2026 🧧"
        },
        "image": {
          "path": "http://localhost:9000/delta-store/axra2mdos8h4emhkdsnndcpx.png",
          "origin": "/axra2mdos8h4emhkdsnndcpx.png",
          "filename": "Chinese NY-Frame.png"
        },
        "everyone": true,
        "start_date": "2026-02-19",
        "end_date": null
      }
    ],
    "location": {
      "id": "E22C94B1-9AF7-46FC-BC28-83C9F7D47BD3",
      "name": {
        "en": "Bangpoo",
        "th": "บางปู"
      },
      "code": "05",
      "sort_order": -1,
      "created_at": "2025-05-14T10:51:07.036+00:00",
      "updated_at": "2025-05-14T10:51:07.036+00:00",
      "deleted_at": null
    },
    "site": {
      "id": "296FA937-7DFD-47C3-A811-629B4CC31038",
      "location_id": "E22C94B1-9AF7-46FC-BC28-83C9F7D47BD3",
      "name": {
        "th": "BP3 (DET05)",
        "en": "BP3 (DET05)"
      },
      "code": "BP3",
      "created_at": "2025-06-16T03:48:13.580+00:00",
      "updated_at": "2026-02-27T08:26:30.393+00:00",
      "deleted_at": null
    },
    "teams": [],
    "employee_info": {
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
    },
    "type_account": "user"
  }
}