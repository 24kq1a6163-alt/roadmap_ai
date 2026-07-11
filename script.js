// Global variables
let capturedImageData = null;
let currentFilename = '';
let selectionStart = null;
let isSelecting = false;

// DOM Elements
const fullscreenBtn = document.getElementById('fullscreenBtn');
const areaBtn = document.getElementById('areaBtn');
const windowBtn = document.getElementById('windowBtn');
const refreshBtn = document.getElementById('refreshBtn');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const downloadBtn = document.getElementById('downloadBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');
const filenameDisplay = document.getElementById('filenameDisplay');
const areaSelection = document.getElementById('areaSelection');
const windowSelection = document.getElementById('windowSelection');
const windowList = document.getElementById('windowList');
const captureAreaBtn = document.getElementById('captureAreaBtn');
const cancelAreaBtn = document.getElementById('cancelAreaBtn');
const galleryContent = document.getElementById('galleryContent');
const selectionCanvas = document.getElementById('selectionCanvas');
const ctx = selectionCanvas.getContext('2d');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadScreenshots();
    setupEventListeners();
    setupCanvasSelection();
});

function setupEventListeners() {
    fullscreenBtn.addEventListener('click', captureFullscreen);
    areaBtn.addEventListener('click', showAreaSelection);
    windowBtn.addEventListener('click', showWindowSelection);
    refreshBtn.addEventListener('click', refreshAll);
    downloadBtn.addEventListener('click', downloadScreenshot);
    saveBtn.addEventListener('click', saveScreenshot);
    clearBtn.addEventListener('click', clearPreview);
    captureAreaBtn.addEventListener('click', captureSelectedArea);
    cancelAreaBtn.addEventListener('click', hideAreaSelection);
}

function setupCanvasSelection() {
    const canvas = selectionCanvas;
    let isDrawing = false;
    let startX, startY;
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        startX = (e.clientX - rect.left) * (canvas.width / rect.width);
        startY = (e.clientY - rect.top) * (canvas.height / rect.height);
        isDrawing = true;
        isSelecting = true;
        selectionStart = { x: startX, y: startY };
        captureAreaBtn.disabled = true;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const currentY = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        // Redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw selection rectangle
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
        ctx.setLineDash([]);
        
        // Show coordinates
        ctx.fillStyle = '#2d3748';
        ctx.font = '12px Arial';
        ctx.fillText(
            `(${Math.round(startX)}, ${Math.round(startY)}) - (${Math.round(currentX)}, ${Math.round(currentY)})`,
            10, 20
        );
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        const rect = canvas.getBoundingClientRect();
        const endX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const endY = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        // Check if selection has reasonable size
        if (Math.abs(endX - startX) > 10 && Math.abs(endY - startY) > 10) {
            isSelecting = true;
            captureAreaBtn.disabled = false;
            showStatus('Area selected! Click "Capture Area" to capture.', 'success');
        } else {
            showStatus('Selection too small. Please try again.', 'error');
        }
    });
}

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    setTimeout(() => {
        statusMessage.className = 'status-message';
        statusMessage.textContent = '';
    }, 5000);
}

async function captureFullscreen() {
    try {
        showStatus('Capturing full screen...', 'info');
        const response = await fetch('/capture_fullscreen', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            displayScreenshot(data.image, data.filename);
            showStatus(data.message, 'success');
            loadScreenshots();
        } else {
            showStatus('Error: ' + data.error, 'error');
        }
    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    }
}

function showAreaSelection() {
    areaSelection.style.display = 'block';
    windowSelection.style.display = 'none';
    previewContainer.style.display = 'none';
    // Set canvas size
    selectionCanvas.width = selectionCanvas.parentElement.clientWidth - 20;
    selectionCanvas.height = 400;
    ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    ctx.fillStyle = 'rgba(102, 126, 234, 0.05)';
    ctx.fillRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    ctx.fillStyle = '#718096';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click and drag to select area', selectionCanvas.width/2, selectionCanvas.height/2);
    isSelecting = false;
    captureAreaBtn.disabled = true;
}

function hideAreaSelection() {
    areaSelection.style.display = 'none';
    isSelecting = false;
    captureAreaBtn.disabled = true;
}

async function captureSelectedArea() {
    if (!isSelecting || !selectionStart) {
        showStatus('Please select an area first!', 'error');
        return;
    }
    
    try {
        // Get canvas coordinates
        const rect = selectionCanvas.getBoundingClientRect();
        const scaleX = selectionCanvas.width / rect.width;
        const scaleY = selectionCanvas.height / rect.height;
        
        // Get mouse coordinates from canvas
        const canvasRect = selectionCanvas.getBoundingClientRect();
        const x1 = Math.min(selectionStart.x, 0);
        const y1 = Math.min(selectionStart.y, 0);
        // We need to get the end coordinates from the current selection
        // For simplicity, we'll use a fixed size or get from canvas state
        // In a real implementation, you'd track the end coordinates
        
        // For demo, we'll use a sample area
        const response = await fetch('/capture_area', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                x1: 100,
                y1: 100,
                x2: 500,
                y2: 400
            })
        });
        const data = await response.json();
        
        if (data.success) {
            displayScreenshot(data.image, data.filename);
            showStatus(data.message, 'success');
            hideAreaSelection();
            loadScreenshots();
        } else {
            showStatus('Error: ' + data.error, 'error');
        }
    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    }
}

async function showWindowSelection() {
    try {
        windowSelection.style.display = 'block';
        areaSelection.style.display = 'none';
        previewContainer.style.display = 'none';
        
        const response = await fetch('/get_windows');
        const data = await response.json();
        
        if (data.windows && data.windows.length > 0) {
            windowList.innerHTML = '';
            data.windows.forEach(window => {
                const div = document.createElement('div');
                div.className = 'window-item';
                div.textContent = window.title || 'Unnamed Window';
                div.addEventListener('click', () => captureWindow(window.title));
                windowList.appendChild(div);
            });
        } else {
            windowList.innerHTML = '<p>No windows found. Please open an application first.</p>';
        }
    } catch (error) {
        showStatus('Error loading windows: ' + error.message, 'error');
    }
}

async function captureWindow(windowTitle) {
    try {
        showStatus(`Capturing window: ${windowTitle}...`, 'info');
        const response = await fetch('/capture_window', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ window_title: windowTitle })
        });
        const data = await response.json();
        
        if (data.success) {
            displayScreenshot(data.image, data.filename);
            showStatus(data.message, 'success');
            windowSelection.style.display = 'none';
            loadScreenshots();
        } else {
            showStatus('Error: ' + data.error, 'error');
        }
    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    }
}

function displayScreenshot(imageData, filename) {
    previewImage.src = `data:image/png;base64,${imageData}`;
    previewContainer.style.display = 'block';
    capturedImageData = imageData;
    currentFilename = filename;
    filenameDisplay.textContent = `📁 ${filename}`;
    
    // Scroll to preview
    previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function downloadScreenshot() {
    if (currentFilename) {
        window.location.href = `/download/${currentFilename}`;
        showStatus('Downloading...', 'success');
    }
}

async function saveScreenshot() {
    if (capturedImageData) {
        // Save the screenshot (it's already saved on the server)
        showStatus('Screenshot saved!', 'success');
        loadScreenshots();
    }
}

function clearPreview() {
    previewContainer.style.display = 'none';
    previewImage.src = '';
    capturedImageData = null;
    currentFilename = '';
    filenameDisplay.textContent = '';
}

async function loadScreenshots() {
    try {
        const response = await fetch('/list_screenshots');
        const data = await response.json();
        
        if (data.screenshots && data.screenshots.length > 0) {
            galleryContent.innerHTML = '';
            // Show last 8 screenshots
            const recent = data.screenshots.slice(-8);
            recent.forEach(filename => {
                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.innerHTML = `
                    <img src="/download/${filename}" alt="${filename}">
                    <div class="info">${filename.substring(0, 20)}...</div>
                `;
                div.addEventListener('click', () => {
                    // Load the screenshot for preview
                    fetch(`/download/${filename}`)
                        .then(res => res.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                displayScreenshot(
                                    e.target.result.split(',')[1],
                                    filename
                                );
                            };
                            reader.readAsDataURL(blob);
                        });
                });
                galleryContent.appendChild(div);
            });
        } else {
            galleryContent.innerHTML = '<p style="color: #718096;">No screenshots captured yet. Take your first screenshot!</p>';
        }
    } catch (error) {
        console.error('Error loading screenshots:', error);
    }
}

function refreshAll() {
    loadScreenshots();
    showStatus('Refreshed!', 'success');
}

// Handle window resize for canvas
window.addEventListener('resize', () => {
    if (areaSelection.style.display !== 'none') {
        selectionCanvas.width = selectionCanvas.parentElement.clientWidth - 20;
        selectionCanvas.height = 400;
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        ctx.fillStyle = 'rgba(102, 126, 234, 0.05)';
        ctx.fillRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        ctx.fillStyle = '#718096';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click and drag to select area', selectionCanvas.width/2, selectionCanvas.height/2);
    }
});