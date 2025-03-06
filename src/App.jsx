import React from 'react';
import AudioRecorder from './components/AudioRecorder';
import './App.css';

function App() {
  return (
    <div className="container">
      <div className="recorder-container">
        <h1 className="mb-4">Audio Recorder</h1>
        <AudioRecorder />
      </div>
    </div>
  );
}

export default App;
