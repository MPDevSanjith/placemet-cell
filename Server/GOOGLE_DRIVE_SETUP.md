# Google Drive Setup Instructions

## Current Issue
The Google Drive service account JSON file has a corrupted private key, causing upload failures.

## How to Fix

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project: `placement-erp`

### 2. Navigate to IAM & Admin > Service Accounts
- Find the service account: `drive-uploader@placement-erp.iam.gserviceaccount.com`
- Or create a new one if it doesn't exist

### 3. Create/Download New Key
- Click on the service account
- Go to "Keys" tab
- Click "Add Key" > "Create new key"
- Choose "JSON" format
- Download the file

### 4. Replace the File
- Replace `Server/src/config/placement-erp-21cf0e73be15.json` with the new downloaded file
- Or rename the new file to match the current filename

### 5. Verify the Key
The JSON should look like this (with actual values):
```json
{
  "type": "service_account",
  "project_id": "placement-erp",
  "private_key_id": "actual-key-id-here",
  "private_key": "-----BEGIN PRIVATE KEY-----\nactual-private-key-content-here\n-----END PRIVATE KEY-----\n",
  "client_email": "drive-uploader@placement-erp.iam.gserviceaccount.com",
  "client_id": "actual-client-id-here",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/drive-uploader%40placement-erp.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### 6. Required Permissions
Ensure the service account has these roles:
- Google Drive API access
- Service Account Token Creator
- Drive File Stream (if needed)

### 7. Test the Integration
After replacing the file:
1. Restart your backend server
2. Try uploading a resume
3. Check the console logs for success messages

## Alternative: Use Fallback Mode
If you can't get Google Drive working immediately, the system will use fallback mode:
- Files will be stored locally
- URLs will be generated but won't work with Google Drive
- Resume uploads will still work for testing

## Troubleshooting
- **Private key encoding errors**: Regenerate the service account key
- **Permission denied**: Check IAM roles and API enablement
- **File not found**: Ensure the JSON file path is correct in the code
