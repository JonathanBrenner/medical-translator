class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;

        this.recordButton = document.getElementById('recordButton');
        this.recordIcon = document.getElementById('recordIcon');
        this.statusText = document.getElementById('statusText');
        this.timer = document.getElementById('timer');
        this.errorMessage = document.getElementById('errorMessage');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.recordButton.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.uploadRecording();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();
            this.updateUI(true);
            this.startTimer();

        } catch (error) {
            this.showError('Could not access microphone. Please ensure microphone permissions are granted.');
            console.error('Error accessing microphone:', error);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            this.updateUI(false);
            this.stopTimer();
        }
    }

    async uploadRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
            this.statusText.textContent = 'Uploading recording...';
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.statusText.textContent = 'Recording uploaded successfully!';
            setTimeout(() => {
                this.statusText.textContent = 'Ready to record';
            }, 3000);

        } catch (error) {
            this.showError('Failed to upload recording. Please try again.');
            console.error('Upload error:', error);
        }
    }

    updateUI(isRecording) {
        this.recordButton.classList.toggle('recording', isRecording);
        this.recordIcon.innerHTML = isRecording ? 
            '<i class="fas fa-stop"></i>' : 
            '<i class="fas fa-microphone"></i>';
        this.statusText.textContent = isRecording ? 
            'Recording...' : 
            'Ready to record';
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        this.timer.textContent = '00:00';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AudioRecorder();
});
