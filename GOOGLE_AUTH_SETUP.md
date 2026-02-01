# Google Authentication Setup Guide (Completed)

## Configuration Status
- **Frontend**: `VITE_GOOGLE_CLIENT_ID` has been configured in `src/.env`.
- **Backend**: `GOOGLE_CLIENT_ID` has been configured in `backend/.env`.
- **Client ID**: `496559138638-6t8t7q3o7o3n00jeo8oi6tki1r3pgkmu.apps.googleusercontent.com`

## Next Steps
To apply the changes:

1.  **Restart Servers**:
    - **Frontend**: Stop and restart `npm run dev` in your main terminal.
    - **Backend**: Stop and restart the backend server (e.g., `npm start` or `nodemon server.js`).

## Usage
- **Login**: Click "Sign in with Google" on the Login page.
- **Registration**: Click "Sign up with Google" on the Registration page.
- Both actions will verify your Google account and create a new user profile if one doesn't exist, utilizing the email associated with your Google account.
