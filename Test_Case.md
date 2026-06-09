# QA Test Cases - Friends Get Friends Referral Web

## Scope

These manual test cases cover the main DeltaHi referral flow:

- Referrer share QR/link lookup
- Receiver employee ID verification
- Receiver registration verification status
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
| Seed data | `prisma/example-data.sql` |
| Browser | Chrome, Safari, or Edge |

## Seed Test Data

| Purpose | Value |
| --- | --- |
| Valid share ID | `UUID` |
| Referrer employee ID | `EMP001` |
| Referrer name | `Arin Somchai` |
| Valid receiver employee ID | `EMP016` |
| Valid receiver name | `Chai Pongsak` |
| Unknown receiver employee ID | `EMP999` |
| Already-used receiver employee ID | `EMP006` |

## Expected Verification Rule

The share app has two different checks:

- Employee ID check: the receiver employee ID exists in HR employee data.
- Registration verification: the receiver has opened the app and completed registration.

Expected business rule:

- After the receiver clicks `Download App`, the admin dashboard should show the receiver as `Unverified`.
- After the receiver opens the app and completes registration, the system should update the receiver status to `Verified`.
- The receiver should not be counted as `Verified` only because they clicked download.
- If the employee ID exists, the share page can show `Employee verified: {name}` to confirm the employee ID is valid.
- If the employee ID does not exist, the user can still download the app, but the referral download is not recorded.
- The backend checks the employee ID again before saving a download record.
- The backend also rejects self-referrals, invalid referral links, and receiver employee IDs that were already submitted under a different referral.
- Clicking `Download App` records `employee_download` only. It does not create an `employee_share` row or QR/share ID for the receiver.
- An `employee_share` row is created only when the main app calls the employee-share API with a valid `service_user.users.id` and matching employee ID.

Implementation note: the app needs a registration update from the DeltaHi app or main backend before the dashboard can change a receiver from `Unverified` to `Verified`. If that integration endpoint or test hook is not available in the test environment, steps that change a receiver to `Verified` are blocked and should be marked as integration-pending, not failed against the referral web UI.

## TC-FGF-001 - Receiver Is Unverified After Download And Verified After Registration

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-001 |
| Title | Verify receiver remains unverified after download and becomes verified only after app registration |
| Feature | Share app referral download |
| Type | Functional, positive |
| Priority | High |
| Preconditions | Local database is seeded. App is running. `NUXT_PUBLIC_DOWNLOAD_URL` is configured to a safe test URL. Browser popups are allowed for the app. A test registration update method is available from the DeltaHi app or main backend. |
| Test Data | Share ID: `22222222-2222-4222-8222-222222222222`; Receiver Employee ID: `EMP016` |

### Steps And Expected Results

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/shareapp/22222222-2222-4222-8222-222222222222`. | Page loads with title `Enter your employee ID`. It shows the referral was shared by `Arin Somchai (EMP001)`. |
| 2 | Enter `EMP016` in the Employee ID field. | After lookup, the page shows `Employee verified: Chai Pongsak`. |
| 3 | Click `Verify & Continue`. | A download popup opens with title `Download the DeltaHi app`. It still shows `Employee verified: Chai Pongsak`. |
| 4 | Click `View Tutorial`. | The popup changes to `Choose your OS` and shows `iOS` and `Android` buttons. |
| 5 | Click `Android`. | Android tutorial content is shown with Android tutorial images. |
| 6 | Click `Back to Download`. | Popup returns to the download step. |
| 7 | Click `Download App`. | The configured download URL opens. The app records an `employee_download` row for the valid employee ID with status `Unverified`. No `employee_share` row or new QR/share ID is created for `EMP016` by this click. |
| 8 | Open `/admin`. | Admin dashboard loads successfully. |
| 9 | Search for `EMP016` before the receiver registers in the app. | `New User Records` shows a row for receiver `EMP016`, referrer `EMP001`, status `Unverified`, and OS equal to the detected device OS or `Unknown`. |
| 10 | Complete registration in the DeltaHi app using receiver employee ID `EMP016`, or trigger the approved registration verification test hook. | App registration succeeds and sends/creates a registration verification update for `EMP016`. |
| 11 | Refresh `/admin` and search for `EMP016` again. | The same receiver row now shows status `Verified`. |

### Actual Result

To be filled by tester.

### Status

Pass / Fail

### Notes

If this test has already been run on the same seeded database, reset the database or use another unused valid receiver such as `EMP017`, `EMP018`, or `EMP019`.

## TC-FGF-002 - Empty Employee ID Shows Validation Error

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-002 |
| Title | Verify empty employee ID cannot continue |
| Feature | Employee ID validation |
| Type | Functional, negative |
| Priority | High |
| Preconditions | App is running. |
| Test Data | Valid share ID: `22222222-2222-4222-8222-222222222222` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/shareapp/22222222-2222-4222-8222-222222222222`. | Employee ID form is visible. |
| 2 | Leave Employee ID empty and click `Verify & Continue`. | Error message `Enter your employee ID.` is shown. Download popup is not opened. |

Actual Result: To be filled by tester.

Status: Pass / Fail

## TC-FGF-003 - Unknown Employee Can Download But Referral Is Not Recorded

| Field | Detail |
| --- | --- |
| Test Case ID | TC-FGF-003 |
| Title | Verify unknown receiver employee ID can continue, but no referral record is saved |
| Feature | Unverified receiver flow |
| Type | Functional, negative |
| Priority | Medium |
| Preconditions | App is running. Browser popups are allowed. |
| Test Data | Share ID: `22222222-2222-4222-8222-222222222222`; Receiver Employee ID: `EMP999` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/shareapp/22222222-2222-4222-8222-222222222222`. | Employee ID form is visible. |
| 2 | Enter `EMP999`. | Warning message says `Employee ID EMP999 was not found. You can still continue to download.` |
| 3 | Click `Verify & Continue`. | Download popup opens and warns that the referral will not be recorded. |
| 4 | Click `Download App`. | The configured download URL opens. |
| 5 | Open `/admin` and search for `EMP999`. | No referral download record is shown for `EMP999`. |

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
| 1 | Open `/shareapp/invalid-share-id`. | Page shows `Referral link is invalid or expired.` |
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
| Preconditions | Local database is seeded. App is running. Browser popups are allowed. |
| Test Data | Share ID: `22222222-2222-4222-8222-222222222222`; Receiver Employee ID: `EMP016` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/shareapp/22222222-2222-4222-8222-222222222222`. | Employee ID form is visible. |
| 2 | Enter `EMP016`, click `Verify & Continue`, then click `Download App`. | Download URL opens and an `employee_download` row is recorded for `EMP016`. |
| 3 | Check `employee_share` records for employee ID `EMP016`. | No new `employee_share` row is created by the download flow. |
| 4 | Create a share for `EMP016` through the main app employee-share API using the valid `service_user.users.id` for `EMP016`. | A new or existing `employee_share` row is returned for `EMP016`, including an `employee_share.id` that can be used to load the QR page. |

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
| Preconditions | App is running. Local database is seeded. |
| Test Data | Employee share ID query: `22222222-2222-4222-8222-222222222222` |

| Step | Action | Expected Result |
| --- | --- | --- |
| 1 | Open `/?employeeShareId=22222222-2222-4222-8222-222222222222`. | QR page loads with title `Friends Get Friends Event`. |
| 2 | Wait for loading to finish. | A QR code is displayed with the DeltaHi app logo in the center. |
| 3 | Scan or inspect the QR link. | QR points to `/shareapp/22222222-2222-4222-8222-222222222222`. |

Actual Result: To be filled by tester.

Status: Pass / Fail
