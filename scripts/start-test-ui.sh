#!/usr/bin/env bash
set -e

echo "Starting mock frontend server..."
# Check if python 3 is available
if command -v python3 &>/dev/null; then
  cd /Users/harshringsia/ODOO_X_NMIT && python3 -m http.server 8000 &
  echo "Mock frontend available at: http://localhost:8000/test-frontend.html"
elif command -v python &>/dev/null; then
  cd /Users/harshringsia/ODOO_X_NMIT && python -m http.server 8000 &
  echo "Mock frontend available at: http://localhost:8000/test-frontend.html"
else
  echo "Python is not available. Please manually serve the frontend or install Python."
  exit 1
fi

# Store the HTTP server PID
HTTP_PID=$!

# Function to kill background processes on exit
function cleanup {
  echo "Stopping servers..."
  kill $HTTP_PID 2>/dev/null || true
}

# Register the cleanup function to run on exit
trap cleanup EXIT

echo ""
echo "Use Ctrl+C to stop the server when done."
echo ""
echo "IMPORTANT: Make sure your microservices are running on ports:"
echo "- Product Service: http://localhost:4001"
echo "- MO Service: http://localhost:4002"
echo "- Inventory Service: http://localhost:4003"
echo "- WO Service: http://localhost:4004"
echo ""
echo "You can start the services with: ./run-services.sh"

# Keep the script alive
wait $HTTP_PID
