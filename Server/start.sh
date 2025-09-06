# Start the Placement ERP Server
# This script starts the server with the clean modular architecture

echo "🚀 Starting Placement ERP Server..."
echo "📁 Using clean modular architecture"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please copy env.example to .env and configure it."
    echo "   cp env.example .env"
    exit 1
fi

# Start the server
echo "✅ Starting server..."
npm start
