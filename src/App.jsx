import React from 'react';
import AudioRecorder from './components/AudioRecorder';
import './App.css';

function App() {
  return (
    <div className="container">
      <div className="recorder-container">
        <img 
          src="/assets/image_1741293054070.png" 
          alt="App Logo" 
          className="app-logo"
        />
        <h1 className="mb-4">Audio Recorder</h1>
        <AudioRecorder />
      </div>
    </div>
  );
}

export default App;