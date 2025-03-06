import os
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import uuid
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app and database
app = Flask(__name__, static_folder='static/dist')
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
    created_at = db.Column(db.DateTime,
                           nullable=False,
                           default=datetime.utcnow)
    file_size = db.Column(db.Integer)  # Size in bytes


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def static_file(path):
    return send_from_directory(app.static_folder, path)


@app.route('/token/<str:language>/', methods=['GET'])
def get_openai_token(language: str):
    try:
        # Check for the API key in environment variables
        api_key = os.environ.get("OPENAI_API_KEY")

        if not api_key:
            # For security, we'll return a generic error rather than specific details
            return jsonify({'error': 'API key not configured'}), 500

        headers = {"Authorization": f"Bearer {api_key}"}
        data = {
            "model": "gpt-4o-mini-realtime-preview-2024-12-17",
            "voice": "alloy",
            "modalities": ["text", "audio"],
            "input_audio_transcription": {
                "model": "whisper-1",
                "language": language
            },
            "tools": None,  # TODO
            "temperature": 0.6  # minumum
        }
        response = requests.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers=headers,
            data=data,
        )
        if response.ok:
            # Handle successful response
            token_data = response.json()["client_secret"]
            return token_data, 200
        else:
            logger.error(f"Error creating OpenAI session: {response.text}")
            return jsonify({'error': 'Failed to create OpenAI session'}), 500

    except Exception as e:
        logger.error(f"Error providing API token: {str(e)}")
        return jsonify({'error': 'Server error while retrieving token'}), 500


# @app.route('/upload', methods=['POST'])
# def upload_audio():
#     try:
#         if 'audio' not in request.files:
#             return jsonify({'error': 'No audio file provided'}), 400

#         audio_file = request.files['audio']
#         if audio_file.filename == '':
#             return jsonify({'error': 'No selected file'}), 400

#         # Generate unique filename
#         filename = f"{uuid.uuid4()}.webm"
#         secure_name = secure_filename(filename)

#         # Save the file
#         filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
#         audio_file.save(filepath)

#         # Get file size
#         file_size = os.path.getsize(filepath)

#         # Create database record
#         recording = AudioRecording(filename=secure_name, file_size=file_size)
#         db.session.add(recording)
#         db.session.commit()

#         logger.info(
#             f"Successfully saved recording: {secure_name}, size: {file_size} bytes"
#         )
#         return jsonify({
#             'message': 'Audio uploaded successfully',
#             'filename': secure_name
#         }), 200

#     except Exception as e:
#         logger.error(f"Error uploading audio: {str(e)}")
#         return jsonify({'error': 'Server error while uploading audio'}), 500

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
