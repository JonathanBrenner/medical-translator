import os
from flask import Flask, render_template, request, jsonify
import logging
from werkzeug.utils import secure_filename
import uuid
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import secrets

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app and database
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db = SQLAlchemy(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Model definition
class AudioRecording(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    file_size = db.Column(db.Integer)  # Size in bytes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/token', methods=['GET'])
def get_openai_token():
    try:
        # Check for the API key in environment variables
        api_key = os.environ.get("OPENAI_API_KEY")
        
        if not api_key:
            # For security, we'll return a generic error rather than specific details
            return jsonify({'error': 'API key not configured'}), 500
            
        # Generate a temporary session token (this is just a demo)
        # In a production app, you would implement proper authentication
        session_token = secrets.token_hex(16)
            
        return jsonify({
            'token': api_key,
            'session_id': session_token,
            'expires_in': 3600  # Token expires in 1 hour
        }), 200
    except Exception as e:
        logger.error(f"Error providing API token: {str(e)}")
        return jsonify({'error': 'Server error while retrieving token'}), 500

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

        # Get file size
        file_size = os.path.getsize(filepath)

        # Create database record
        recording = AudioRecording(
            filename=secure_name,
            file_size=file_size
        )
        db.session.add(recording)
        db.session.commit()

        logger.info(f"Successfully saved recording: {secure_name}, size: {file_size} bytes")
        return jsonify({
            'message': 'Audio uploaded successfully',
            'filename': secure_name
        }), 200

    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        return jsonify({'error': 'Server error while uploading audio'}), 500

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)