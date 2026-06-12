# Friend Invite Friend Check User API

This endpoint verifies the referrer employee ID before the app creates a QR code.

It is used only after the referrer manually submits their employee ID on the first input page.

## Current Workflow

1. Referrer opens `/friend-invite-friend/user_Id`.
2. Referrer manually enters their employee ID.
3. After the referrer presses Generate QR Code, the first page calls `GET /api/friend-invite-friend/check-user?employee_id=[employee_id]`.
4. If the employee ID is valid, the API returns the DeltaHi user id and employee data.
5. The first page sends that user id to `POST /api/employee-shares`.
6. `POST /api/employee-shares` creates or reuses the `employee_share` row.
7. The first page navigates to `/friend-invite-friend/qr-code?employeeShareId=[employee_share.id]`.
8. The QR page loads that share with `GET /api/shares/[employee_share.id]`.
9. The QR page generates a QR code from the returned share URL.
10. The QR points friends to `/friend-invite-friend/shareapp/[employee_share.id]`.

## Endpoint

```http
GET /api/friend-invite-friend/check-user
```

## Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `employee_id` | string | yes | Referrer's employee ID |

`employeeId` is also accepted by the local implementation as a fallback query name, but `employee_id` is the expected contract.

## Example Request

```http
GET /api/friend-invite-friend/check-user?employee_id=86676767
```

## Success Response

The first input page needs these fields:

| Field | Usage |
| --- | --- |
| `data.id` | Sent as `userId` to `POST /api/employee-shares` |
| `data.employee_id` | Sent as `employeeId` to `POST /api/employee-shares` |
| `data.point_balance` | Sent as `pointBalance` to `POST /api/employee-shares` |
| `data.employee_info.full_name` | Available for display/debugging, but QR creation does not require it |

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "id": "F8BE1C16-4E36-406D-9F56-54DD32F007E0",
    "employee_id": "86676767",
    "point_balance": 0,
    "username": "86676767",
    "employee_info": {
      "emp_id": "86676767",
      "name": "Six",
      "surname": "Seven",
      "full_name": "Six Seven",
      "full_name_th": "หก เจ็ด"
    },
    "type_account": "user"
  }
}
```

## Error Responses

### Missing or Invalid Employee ID

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "statusCode": 400,
  "statusMessage": "Employee ID is required."
}
```

### User Not Found

```http
HTTP/1.1 404 Not Found
```

```json
{
  "statusCode": 404,
  "statusMessage": "User was not found."
}
```

## QR Page Usage

After `check-user` succeeds, the first input page calls:

```http
POST /api/employee-shares
```

Request body:

```json
{
  "userId": "F8BE1C16-4E36-406D-9F56-54DD32F007E0",
  "employeeId": "86676767",
  "pointBalance": 0
}
```

Expected response:

```json
{
  "share": {
    "id": "22222222-2222-4222-8222-222222222222",
    "userId": "F8BE1C16-4E36-406D-9F56-54DD32F007E0",
    "employeeId": "86676767",
    "employeeName": "Six Seven",
    "pointBalance": 0,
    "shareUrl": "https://deltahi.vercel.io/friend-invite-friend/shareapp/22222222-2222-4222-8222-222222222222"
  }
}
```

Then the first input page redirects to:

```http
GET /friend-invite-friend/qr-code?employeeShareId=22222222-2222-4222-8222-222222222222
```

The QR page loads the share and generates the QR code from `share.shareUrl`.
