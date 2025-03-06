import os
from flask import Flask, render_template, request, jsonify
import logging
from werkzeug.utils import secure_filename
import uuid

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Generate unique filename
        filename = f"{uuid.uuid4()}.webm"
        secure_name = secure_filename(filename)
        
        # Save the file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
        audio_file.save(filepath)
        
        return jsonify({
            'message': 'Audio uploaded successfully',
            'filename': secure_name
        }), 200

    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        return jsonify({'error': 'Server error while uploading audio'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
