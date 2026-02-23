docker run -d \
  -p 3000:3000 \
  -v /path/on/your/host:/app/data \
  --name grocery-app \
  your-grocery-app-image