# Friend Get Friend Check User API

This endpoint prepares the referrer employee ID before the app creates a QR code.

It is used only after the referrer manually submits their employee ID on the first input page.

## Current Workflow

1. Referrer opens `/friend-get-friend/user_Id`.
2. Referrer manually enters their employee ID.
3. After the referrer presses Generate QR Code, the first page calls `GET /api/friend-get-friend/check-user?employee_id=[employee_id]`.
4. The API returns the normalized employee ID.
5. The first page sends that employee ID to `POST /api/employee-shares`.
6. `POST /api/employee-shares` creates or reuses the local `employee_share` row.
7. The first page navigates to `/friend-get-friend/qr-code?employeeShareId=[employee_share.id]`.
8. The QR page loads that share with `GET /api/shares/[employee_share.id]`.
9. The QR page generates a QR code from the returned share URL.
10. The QR points friends to `/friend-get-friend/shareapp/[employee_share.id]`.

## Endpoint

```http
GET /api/friend-get-friend/check-user
```

## Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `employee_id` | string | yes | Referrer's employee ID |

`employeeId` is also accepted by the local implementation as a fallback query name, but `employee_id` is the expected contract.

## Example Request

```http
GET /api/friend-get-friend/check-user?employee_id=86676767
```

## Success Response

The first input page needs these fields:

| Field | Usage |
| --- | --- |
| `data.employee_id` | Sent as `employeeId` to `POST /api/employee-shares` |

```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "employee_id": "86676767",
    "username": "86676767",
    "type_account": "user"
  }
}
```

The endpoint itself does not write database rows.

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

### Too Many Requests

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 30
```

```json
{
  "statusCode": 429,
  "statusMessage": "Too many requests. Please try again later."
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
  "employeeId": "86676767"
}
```

`POST /api/employee-shares` creates or reuses `employee_share` by employee ID.

Expected response:

```json
{
  "share": {
    "id": "22222222-2222-4222-8222-222222222222",
    "employeeId": "86676767",
    "shareUrl": "https://deltahi.vercel.io/friend-get-friend/shareapp/22222222-2222-4222-8222-222222222222"
  }
}
```

Then the first input page redirects to:

```http
GET /friend-get-friend/qr-code?employeeShareId=22222222-2222-4222-8222-222222222222
```

The QR page loads the share and generates the QR code from `share.shareUrl`.
