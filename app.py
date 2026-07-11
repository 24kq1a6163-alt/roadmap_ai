from flask import Flask, render_template, request, jsonify, send_file
import pyautogui
import os
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image
import cv2
import numpy as np

app = Flask(__name__)

# Create screenshots folder if it doesn't exist
SCREENSHOTS_DIR = 'screenshots'
if not os.path.exists(SCREENSHOTS_DIR):
    os.makedirs(SCREENSHOTS_DIR)

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/capture_fullscreen', methods=['POST'])
def capture_fullscreen():
    """Capture the entire screen"""
    try:
        # Take screenshot
        screenshot = pyautogui.screenshot()
        
        # Save with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'fullscreen_{timestamp}.png'
        filepath = os.path.join(SCREENSHOTS_DIR, filename)
        screenshot.save(filepath)
        
        # Convert to base64 for preview
        buffered = BytesIO()
        screenshot.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'message': 'Full screen captured successfully!',
            'filename': filename,
            'image': img_str
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/capture_area', methods=['POST'])
def capture_area():
    """Capture a selected area of the screen"""
    try:
        data = request.json
        x1 = int(data['x1'])
        y1 = int(data['y1'])
        x2 = int(data['x2'])
        y2 = int(data['y2'])
        
        # Ensure coordinates are in correct order
        left = min(x1, x2)
        top = min(y1, y2)
        right = max(x1, x2)
        bottom = max(y1, y2)
        width = right - left
        height = bottom - top
        
        # Take screenshot of selected area
        screenshot = pyautogui.screenshot(region=(left, top, width, height))
        
        # Save with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'area_{timestamp}.png'
        filepath = os.path.join(SCREENSHOTS_DIR, filename)
        screenshot.save(filepath)
        
        # Convert to base64 for preview
        buffered = BytesIO()
        screenshot.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'message': 'Area captured successfully!',
            'filename': filename,
            'image': img_str
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/capture_window', methods=['POST'])
def capture_window():
    """Capture a specific application window"""
    try:
        # Get all windows
        import pygetwindow as gw
        
        windows = gw.getWindowsWithTitle(request.json.get('window_title', ''))
        if windows:
            window = windows[0]
            # Activate the window
            window.activate()
            # Wait a bit for the window to be active
            import time
            time.sleep(0.5)
            
            # Capture the window
            screenshot = pyautogui.screenshot(region=(
                window.left, window.top, 
                window.width, window.height
            ))
            
            # Save with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'window_{timestamp}.png'
            filepath = os.path.join(SCREENSHOTS_DIR, filename)
            screenshot.save(filepath)
            
            # Convert to base64 for preview
            buffered = BytesIO()
            screenshot.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return jsonify({
                'success': True,
                'message': f'Window "{window.title}" captured!',
                'filename': filename,
                'image': img_str
            })
        else:
            return jsonify({'success': False, 'error': 'No window found with that title'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_windows', methods=['GET'])
def get_windows():
    """Get list of open windows"""
    try:
        import pygetwindow as gw
        windows = gw.getAllWindows()
        window_list = [{'title': w.title, 'id': id(w)} for w in windows if w.title]
        return jsonify({'windows': window_list})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/download/<filename>')
def download(filename):
    """Download the captured screenshot"""
    try:
        filepath = os.path.join(SCREENSHOTS_DIR, filename)
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/list_screenshots', methods=['GET'])
def list_screenshots():
    """List all saved screenshots"""
    try:
        files = os.listdir(SCREENSHOTS_DIR)
        screenshots = [f for f in files if f.endswith(('.png', '.jpg', '.jpeg'))]
        return jsonify({'screenshots': screenshots})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    print("📸 Screenshot Application Starting...")
    print("🌐 Open your browser and go to: http://127.0.0.1:5000")
    print("⚠️  Make sure to grant screen recording permissions if prompted")
    app.run(debug=True, host='127.0.0.1', port=5000)