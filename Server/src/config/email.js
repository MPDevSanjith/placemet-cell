// Lightweight bridge for email initialization used by server.js (CommonJS)
// This avoids requiring the ESM email module at boot.

export function initializeEmail() {
	const hasCreds = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
	if (hasCreds) {
		console.log('📧 Email credentials detected. Email service will be initialized by ESM module when used.')
	} else {
		console.log('⚠️ Email credentials not set. Skipping email transporter setup at startup.')
	}
}


