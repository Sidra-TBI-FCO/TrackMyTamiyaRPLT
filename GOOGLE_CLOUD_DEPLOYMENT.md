# Google Cloud Run Deployment Guide

## Overview
This document provides instructions for deploying TrackMyRC to Google Cloud Run with email functionality enabled.

## Prerequisites
- Google Cloud Project created
- Cloud Build API enabled
- Cloud Run API enabled
- Secret Manager API enabled
- Artifact Registry repository created

## Required Secrets in Google Cloud Secret Manager

You need to create the following secrets in Google Cloud Secret Manager:

### 1. Database Connection String
```bash
echo -n "your-database-connection-string" | gcloud secrets create db-connection-string --data-file=-
```

### 2. Google OAuth Credentials
```bash
echo -n "your-google-client-id" | gcloud secrets create google-client-id --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create google-client-secret --data-file=-
```

### 3. Google Cloud Storage Service Account
```bash
echo -n 'your-service-account-json' | gcloud secrets create gcs-service-account --data-file=-
```

### 4. Session Secret
```bash
# Generate a random session secret
openssl rand -base64 32 | gcloud secrets create session-secret --data-file=-
```

### 5. Email Service Credentials (NEW)
```bash
# Gmail email address
echo -n "trckmyrc25@gmail.com" | gcloud secrets create email-user --data-file=-

# Gmail App Password (16 characters, no spaces)
echo -n "dfmswnqkriutscao" | gcloud secrets create email-app-password --data-file=-
```

## How to Get Gmail App Password

1. Go to your Google Account settings (https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** (must be enabled first)
3. Scroll down to **App passwords**
4. Generate a new app password for **Mail**
5. Copy the 16-character password (remove spaces if shown)
6. Use this password for the `email-app-password` secret

## Verify Secrets Are Created

```bash
gcloud secrets list
```

You should see all 7 secrets:
- db-connection-string
- google-client-id
- google-client-secret
- gcs-service-account
- session-secret
- email-user
- email-app-password

## Deploy to Cloud Run

Once all secrets are created, deploy using Cloud Build:

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Configuration Files Updated

The following files have been updated to support email functionality:

### `cloudbuild.yaml`
- Added IAM policy bindings for `email-user` and `email-app-password` secrets
- Updated `--set-secrets` to include EMAIL_USER and EMAIL_APP_PASSWORD environment variables

### `server/emailService.ts`
- Nodemailer configuration for Gmail SMTP
- Email templates for verification and password reset
- Fallback to console logging if credentials not configured

### `server/traditionalAuth.ts`
- Password reset request endpoint: `POST /api/auth/request-password-reset`
- Password reset confirmation endpoint: `POST /api/auth/reset-password`
- Email verification sending integrated

## Email Features

### Email Verification
- Sent automatically after registration
- Contains clickable verification link
- Token-based verification system

### Password Reset
- Users can request reset from login page
- Reset link expires after 1 hour
- Secure token-based system
- New password must be at least 8 characters

## Testing Email Functionality

1. Register a new account with a real email address
2. Check your inbox for verification email
3. Click "Forgot Password?" on login page
4. Enter your email and check inbox for reset link
5. Follow reset link and set new password

## Troubleshooting

### Emails Not Sending
- Verify `EMAIL_USER` and `EMAIL_APP_PASSWORD` secrets are correctly set
- Check Cloud Run logs for email service errors
- Ensure Gmail account has 2-Step Verification enabled
- Verify App Password is correct (16 characters, no spaces)

### Email Going to Spam
- Add sender address to your contacts
- Check spam folder
- Consider using a custom domain with verified sender

### Secret Access Errors
- Verify service account has `roles/secretmanager.secretAccessor` role
- Check IAM policy bindings in cloudbuild.yaml
- Ensure secrets exist in Secret Manager

## Environment Variables

The application uses these email-related environment variables:

- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_APP_PASSWORD`: Gmail App Password for authentication

These are automatically injected by Cloud Run from Secret Manager.

## Security Notes

- Never commit secrets to version control
- Use Secret Manager for all sensitive credentials
- Gmail App Passwords are safer than using your main password
- Password reset tokens expire after 1 hour
- All email communications use HTTPS links

## Cost Considerations

- Secret Manager: $0.06 per 10,000 access operations
- Cloud Run: Pay only for usage (scales to zero)
- Gmail SMTP: Free for reasonable volume (sending limit: ~500/day)

## Next Steps

After deployment:
1. Test registration flow with real email
2. Test password reset flow
3. Monitor Cloud Run logs for any errors
4. Set up custom domain (optional)
5. Configure email templates with your branding (optional)
