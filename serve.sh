#!/bin/bash
PORT=8080

# Kill any existing server on this port
lsof -ti:$PORT | xargs kill -9 2>/dev/null

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
echo ""
echo "  Yeti Downhill running at:"
echo ""
echo "  Local:   http://localhost:$PORT/yeti-downhill.html"
echo "  iPhone:  http://$IP:$PORT/yeti-downhill.html"
echo ""
echo "  (Make sure your phone is on the same Wi-Fi)"
echo "  Press Ctrl+C to stop"
echo ""
python3 -m http.server $PORT --bind 0.0.0.0