# Standard Operating Procedures (SOPs) - MFL Administration

## 1. User Management SOP

### 1.1. Onboarding New Users
1.  **Request:** Receive user access request form (approved by immediate supervisor).
2.  **Verification:** Verify user identity and required access level (National vs. Sub-national).
3.  **Creation:**
    *   Log in as Administrator.
    *   Navigate to `User/Admin Management`.
    *   Click `Create User`.
    *   Enter details: Username, Email, First/Last Name.
    *   **Assign Role:** Select appropriate role (e.g., `Viewer`, `Editor`, `Approver`).
    *   **Assign Jurisdiction:**
        *   For National users: Select "National".
        *   For Provincial users: Select specific Province.
        *   For District users: Select specific District.
4.  **Notification:** System sends welcome email with temporary password.

### 1.2. Offboarding Users
1.  **Trigger:** Notification of staff departure or role change.
2.  **Action:** Deactivate user account immediately. Do not delete the account to preserve audit logs.

## 2. Data Management SOP

### 2.1. Facility Verification & Approval
1.  **Trigger:** Notification of new facility submission (`PENDING_REVIEW`).
2.  **Review:**
    *   Check for duplicates (Name/Location match).
    *   Verify coordinates fall within the declared District.
    *   Cross-check with official gazette lists or internal documents.
3.  **Decision:**
    *   **Approve:** Change status to `APPROVED`.
    *   **Reject:** Return to `DRAFT` with comments explaining the deficiency.

### 2.2. Data Quality Audits
*   **Frequency:** Quarterly.
*   **Process:** Generate "Incomplete Records" report. Contact respective Provincial Health Officers (PHOs) to fill gaps (e.g., missing GPS, zero staff counts).

## 3. System Maintenance SOP

### 3.1. Database Backup
*   **Frequency:** Daily (Automated), Weekly (Manual Verification).
*   **Procedure:**
    *   Run `pg_dump` command targeting `mfl_db`.
    *   Store backup file in secure, off-site storage.
    *   Retention: Keep daily backups for 30 days, monthly backups for 1 year.

### 3.2. Updates & Patching
*   **Schedule:** Monthly maintenance window.
*   **Procedure:**
    *   Test updates on Staging environment first.
    *   Announce downtime to users 24 hours in advance.
    *   Apply updates to Production.
    *   Verify system stability post-update.
