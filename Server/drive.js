import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Drive scopes
const scopes = ['https://www.googleapis.com/auth/drive'];

// Generate URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // this ensures you get a refresh token
  scope: scopes,
});

console.log('Authorize this app by visiting this URL:\n', authUrl);
