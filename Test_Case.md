# QA Test Cases - Friends Get Friends Referral Web

## Scope

These manual test cases cover the main DeltaHi referral flow:

- Referrer share QR/link lookup
- Receiver employee ID submission
- Download popup and tutorial flow
- Download record visibility in the admin dashboard
- Employee share QR/link lookup

## Test Environment

| Field | Value |
| --- | --- |
| Project | Friends Get Friends Referral Web |
| App Type | Nuxt referral web app |
| Local setup | Run `npm run db:setup`, then `npm run dev` |
| Base URL | `http://localhost:3000` or the port shown by Nuxt |
| Example data | `prisma/example-data.sql` clears local sample rows and does not insert mock records |
| Browser | Chrome, Safari, or Edge |

## Manual Test Data

| Purpose | Value |
| --- | --- |
| Valid share ID | `[valid-employee-share-id]` from the referrer QR flow or test database |
| Referrer employee ID | `[valid-referrer-employee-id]` |
| Referrer name | Referrer employee ID shown by the referral record |
| Valid receiver employee ID | `[valid-receiver-employee-id]` |
| New receiver employee ID | `[new-receiver-employee-id]` |
| Already-used receiver employee ID | `[receiver-employee-id-already-recorded-under-another-share]` |

## Expected Record Rule

The share app is a record-only referral workflow:

- The receiver can enter an employee ID and continue to the download popup.
- clicking `Download App` records an `employee_download` row without HR/reference lookup.
- The backend also rejects self-referrals, invalid referral links, and receiver employee IDs that were already submitted under a different referral.
- Clicking `Download App` records `employee_download` only. It does not create an `employee_share` row or QR/share ID for the receiver.
- An `employee_share` row is created only when the referrer QR flow calls the employee-share API. That API creates or reuses a share by employee ID only.
- The admin dashboard is based on saved `employee_download` records only. It does not wait for app registration or a main app callback.

## TC-FGF-001 - Valid Receiver Download Is Recorded

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-001 |
| Title | Verify valid receiver employee ID creates a referral download record |
| Feature | Share app referral download |
| Type | Functional, positive |
| Priority | High |
| Preconditions | App is running. `NUXT_PUBLIC_DOWNLOAD_URL` is configured to a safe test URL. Browser popups are allowed for the app. A valid `employee_share` exists in the test database. |
| Test Data | Share ID: `[valid-employee-share-id]`; Receiver Employee ID: `[valid-receiver-employee-id]` |

### Steps And Expected Results

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/friend-get-friend/shareapp/[valid-employee-share-id]`. | Page loads with title `Enter your employee ID`. It shows the referral owner. |
| 2 | Enter `[valid-receiver-employee-id]` and click `Verify & Continue`. | A download popup opens with title `Download the DeltaHi app`. |
| 3 | Click `View Tutorial`. | The popup changes to `Choose your OS` and shows `iOS` and `Android` buttons. |
| 4 | Click `Android`. | Android tutorial content is shown with Android tutorial images. |
| 5 | Click `Back to Download`. | Popup returns to the download step. |
| 6 | Click `Download App`. | The configured download URL opens. The app records an `employee_download` row for the valid employee ID. No `employee_share` row or new QR/share ID is created for the receiver by this click. |
| 7 | Open `/friend-get-friend/admin`. | Admin dashboard loads successfully. |
| 8 | Search for `[valid-receiver-employee-id]`. | `Referral Records` shows a row for the receiver, referrer, and OS equal to the detected device OS or `Unknown`. |

### Actual Result

To be filled by tester.

### Status

Pass / Fail

### Notes

If this test has already been run on the same database, clear the referral records or use another unused valid receiver employee ID.

## TC-FGF-002 - Empty Employee ID Shows Validation Error

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-002 |
| Title | Verify empty employee ID cannot continue |
| Feature | Employee ID validation |
| Type | Functional, negative |
| Priority | High |
| Preconditions | App is running. |
| Test Data | Valid share ID: `[valid-employee-share-id]` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/friend-get-friend/shareapp/[valid-employee-share-id]`. | Employee ID form is visible. |
| 2 | Leave Employee ID empty and click `Verify & Continue`. | Error message `Enter your employee ID.` is shown. Download popup is not opened. |

Actual Result: To be filled by tester.

Status: Pass / Fail

## TC-FGF-003 - New Receiver Employee ID Is Recorded

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-003 |
| Title | Verify new receiver employee ID can continue and is recorded |
| Feature | Record-only receiver flow |
| Type | Functional, positive |
| Priority | Medium |
| Preconditions | App is running. Browser popups are allowed. |
| Test Data | Share ID: `[valid-employee-share-id]`; Receiver Employee ID: `[new-receiver-employee-id]` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/friend-get-friend/shareapp/[valid-employee-share-id]`. | Employee ID form is visible. |
| 2 | Enter `[new-receiver-employee-id]` and click `Verify & Continue`. | Download popup opens. |
| 3 | Click `Download App`. | The configured download URL opens and the backend records an `employee_download` row for the receiver ID. |
| 4 | Open `/friend-get-friend/admin` and search for `[new-receiver-employee-id]`. | A referral download record is shown for the receiver ID. |

Actual Result: To be filled by tester.

Status: Pass / Fail

## TC-FGF-004 - Invalid Referral Link Is Rejected

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-004 |
| Title | Verify invalid referral link shows an error |
| Feature | Referral link validation |
| Type | Functional, negative |
| Priority | High |
| Preconditions | App is running. |
| Test Data | Invalid share ID: `invalid-share-id` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/friend-get-friend/shareapp/invalid-share-id`. | Page shows `Referral link is invalid or expired.` |
| 2 | Check the page content. | Employee ID form is not available for the invalid referral. |

Actual Result: To be filled by tester.

Status: Pass / Fail

## TC-FGF-005 - Download Does Not Create Receiver Share ID

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-005 |
| Title | Verify receiver download does not create a new employee share QR id |
| Feature | Employee share creation boundary |
| Type | Functional, negative |
| Priority | High |
| Preconditions | App is running. Browser popups are allowed. A valid `employee_share` exists in the test database. |
| Test Data | Share ID: `[valid-employee-share-id]`; Receiver Employee ID: `[valid-receiver-employee-id]` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/friend-get-friend/shareapp/[valid-employee-share-id]`. | Employee ID form is visible. |
| 2 | Enter `[valid-receiver-employee-id]`, click `Verify & Continue`, then click `Download App`. | Download URL opens and an `employee_download` row is recorded for the receiver. |
| 3 | Check `employee_share` records for the receiver employee ID. | No new `employee_share` row is created by the download flow. |
| 4 | Create a share for the receiver through the employee-share API using a valid employee ID payload. | A new or existing `employee_share` row is returned, including an `employee_share.id` that can be used to load the QR page. |

Actual Result: To be filled by tester.

Status: Pass / Fail

## TC-FGF-006 - QR Page Loads For Valid Employee Share ID

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-006 |
| Title | Verify QR page generates a referral QR code for a valid employee share ID |
| Feature | QR referral page |
| Type | Functional, positive |
| Priority | Medium |
| Preconditions | App is running. A valid `employee_share` row exists in the test database. |
| Test Data | Employee share ID query: `[valid-employee-share-id]` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/friend-get-friend/qr-code?employeeShareId=[valid-employee-share-id]`. | QR page loads with title `Friends Get Friends Event`. |
| 2 | Wait for loading to finish. | A QR code is displayed with the DeltaHi app logo in the center. |
| 3 | Scan or inspect the QR link. | QR points to `/friend-get-friend/shareapp/[valid-employee-share-id]`. |

Actual Result: To be filled by tester.

Status: Pass / Fail
