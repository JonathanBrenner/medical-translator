from datetime import datetime
from app import db

class AudioRecording(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    duration = db.Column(db.Float)  # Duration in seconds
    file_size = db.Column(db.Integer)  # Size in bytes
