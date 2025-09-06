import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import { initializeEmail } from './email/email.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function start() {
	try {
		await connectDB();
		console.log('✅ Database connected');
		initializeEmail();
		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
			console.log(`📊 Health check: http://localhost:${PORT}/health`);
			console.log(`🔗 API Base: http://localhost:${PORT}/api`);
		});
	} catch (err) {
		console.error('❌ Failed to start server:', err);
		process.exit(1);
	}
}

start();


