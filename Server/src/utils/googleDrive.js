const { google } = require('googleapis')
const stream = require('stream')
const path = require('path')

// Load environment variables from the correct path
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

// Debug logging for environment variables
console.log('🔍 Google Drive Debug - Environment variables:')
console.log('  GDRIVE_SHARED_DRIVE_ID:', process.env.GDRIVE_SHARED_DRIVE_ID)
console.log('  GDRIVE_FOLDER_ID:', process.env.GDRIVE_FOLDER_ID)
console.log('  GOOGLE_CREDENTIALS:', process.env.GOOGLE_CREDENTIALS ? 'Set' : 'Not set')
console.log('  GDRIVE_SERVICE_ACCOUNT:', process.env.GDRIVE_SERVICE_ACCOUNT ? 'Set' : 'Not set')

// Try to load credentials from different sources
let credentials
let driveId

try {
  // First try environment variables
  if (process.env.GOOGLE_CREDENTIALS) {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf-8'))
  } else if (process.env.GDRIVE_SERVICE_ACCOUNT) {
    credentials = JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT)
  } else {
    // Try to load from drive.json file
    const driveJsonPath = path.join(__dirname, '../../drive.json')
    const fs = require('fs')
    if (fs.existsSync(driveJsonPath)) {
      const fileContent = fs.readFileSync(driveJsonPath, 'utf8')
      console.log('📁 Loading credentials from drive.json')
      credentials = JSON.parse(fileContent)
      console.log('✅ Credentials loaded successfully from drive.json')
    } else {
      throw new Error('No Google Drive credentials found')
    }
  }

  // Use shared drive ID from environment or default to service account's drive
  driveId = process.env.GDRIVE_SHARED_DRIVE_ID || process.env.GDRIVE_FOLDER_ID || null
  
  console.log('🔍 Google Drive Debug - Loaded values:')
  console.log('  credentials:', credentials ? 'Loaded' : 'Not loaded')
  console.log('  driveId:', driveId)
  
} catch (error) {
  console.error('❌ Failed to load Google Drive credentials:', error.message)
  console.error('📄 Error details:', error)
  credentials = null
  driveId = null
}

const SCOPES = ['https://www.googleapis.com/auth/drive']
let auth, drive

const initializeAuth = () => {
  if (!credentials) return false
  try {
    auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
    drive = google.drive({ version: 'v3', auth })
    return true
  } catch (error) {
    console.error('Failed to initialize Google Drive auth:', error.message)
    return false
  }
}

const getOrCreateFolder = async (folderName) => {
  try {
    if (!drive) {
      if (!initializeAuth()) return null
    }

    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`
    let parents = []

    if (driveId) {
      // Use shared drive
      query += ` and '${driveId}' in parents`
      parents = [driveId]
      console.log(`🔍 Searching for folder '${folderName}' in shared drive: ${driveId}`)
    } else {
      // Use service account's drive (this will fail due to quota)
      console.log('⚠️ No shared drive ID configured - service account has no storage quota')
      throw new Error('Service account has no storage quota. Please configure a shared drive ID.')
    }

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: !!driveId,
      supportsAllDrives: !!driveId
    })

    if (res.data.files.length > 0) {
      console.log(`✅ Found existing folder: ${res.data.files[0].name} (ID: ${res.data.files[0].id})`)
      return res.data.files[0].id
    }

    // Create folder in shared drive
    console.log(`📁 Creating folder '${folderName}' in shared drive`)
    const folder = await drive.files.create({
      requestBody: { 
        name: folderName, 
        mimeType: 'application/vnd.google-apps.folder', 
        parents: parents 
      },
      fields: 'id',
      supportsAllDrives: !!driveId
    })

    console.log(`✅ Created folder '${folderName}' with ID: ${folder.data.id}`)
    return folder.data.id
  } catch (error) {
    console.error('Failed to get or create folder:', error.message)
    return null
  }
}

const uploadFile = async (fileBuffer, fileName, mimeType = 'application/pdf') => {
  try {
    if (!credentials) {
      throw new Error('Google Drive credentials not available')
    }

    if (!initializeAuth()) {
      throw new Error('Failed to initialize Google Drive authentication')
    }

    if (!driveId) {
      throw new Error('No shared drive ID configured. Service accounts have no storage quota. Please set GDRIVE_SHARED_DRIVE_ID environment variable.')
    }

    const folderId = await getOrCreateFolder('Placement ERP Resumes')
    if (!folderId) {
      throw new Error('Failed to create or access Google Drive folder')
    }

    console.log(`📤 Uploading file '${fileName}' to Google Drive folder: ${folderId}`)
    const bufferStream = new stream.PassThrough()
    bufferStream.end(fileBuffer)

    const res = await drive.files.create({
      requestBody: { 
        name: fileName, 
        parents: [folderId] 
      },
      media: { mimeType, body: bufferStream },
      fields: 'id',
      supportsAllDrives: !!driveId
    })

    console.log(`✅ File uploaded successfully with ID: ${res.data.id}`)

    // Make file publicly readable
    await drive.permissions.create({ 
      fileId: res.data.id, 
      requestBody: { role: 'reader', type: 'anyone' }, 
      supportsAllDrives: !!driveId 
    })

    console.log(`🔗 File made publicly readable`)

    return { 
      success: true, 
      fileId: res.data.id, 
      fileUrl: `https://drive.google.com/file/d/${res.data.id}/view`,
      id: res.data.id,
      link: `https://drive.google.com/file/d/${res.data.id}/view`,
      storage: 'google-drive'
    }

  } catch (err) {
    console.error('Google Drive upload error:', err.message)
    throw new Error(`Failed to upload to Google Drive: ${err.message}`)
  }
}

const initialize = async () => {
  try {
    if (!credentials) {
      console.error('❌ No Google Drive credentials available')
      return false
    }

    if (!initializeAuth()) {
      console.error('❌ Failed to initialize Google Drive authentication')
      return false
    }

    if (!driveId) {
      console.error('❌ No shared drive ID configured')
      console.error('💡 To fix this:')
      console.error('   1. Create a shared drive in Google Workspace')
      console.error('   2. Share it with your service account email')
      console.error('   3. Set GDRIVE_SHARED_DRIVE_ID environment variable')
      console.error('   4. Or set GDRIVE_FOLDER_ID to a specific folder ID')
      return false
    }

    const folderId = await getOrCreateFolder('Placement ERP Resumes')
    if (!folderId) {
      console.error('❌ Failed to create or access Google Drive folder')
      return false
    }

    console.log('✅ Google Drive initialized successfully')
    console.log(`📁 Resume folder ID: ${folderId}`)
    console.log(`🔗 Shared drive ID: ${driveId}`)
    return true
  } catch (err) {
    console.error('❌ Google Drive initialization failed:', err.message)
    return false
  }
}

module.exports = { uploadFile, initialize }
