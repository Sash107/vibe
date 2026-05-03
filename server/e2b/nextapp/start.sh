APP_DIR="/home/user/myapp"

trap "echo 'Stopping...'; exit 0" SIGINT SIGTERM

cd $APP_DIR || exit 1

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies with npm..."
  npm install
fi

while true; do
  echo "Starting Next.js dev server..."

  npm run dev -- --turbo --port 3000

  echo "Dev server exited. Restarting in 2 seconds..."
  sleep 2
done