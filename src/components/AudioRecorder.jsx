import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faStop } from "@fortawesome/free-solid-svg-icons";
import { getOpenAIToken, uploadAudio } from "../api";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState("00:00");
  const [status, setStatus] = useState("Ready to record");
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);

  const mediaRecorder = useRef(null);
  const startTime = useRef(null);
  const timerInterval = useRef(null);
  const audioChunks = useRef([]);

  const startTimer = () => {
    startTime.current = Date.now();
    timerInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      setTimer(
        `${minutes.toString().padStart(2, "0")}:${remainingSeconds
          .toString()
          .padStart(2, "0")}`,
      );
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      setTimer("00:00");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        await uploadRecording(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setStatus("Recording...");
      startTimer();
    } catch (error) {
      setError(
        "Could not access microphone. Please ensure microphone permissions are granted.",
      );
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setStatus("Processing recording...");
      stopTimer();
    }
  };

  const uploadRecording = async (audioBlob) => {
    try {
      setStatus('Uploading recording...');
      const response = await uploadAudio(audioBlob);
      setStatus('Recording uploaded successfully!');
      setTimeout(() => setStatus('Ready to record'), 3000);
    } catch (error) {
      setError('Failed to upload recording. Please try again.');
      setStatus('Ready to record');
      console.error('Upload error:', error);
    }
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const tokenData = await getOpenAIToken('en');
        setToken(tokenData);
      } catch (error) {
        setError("Error fetching API token.");
      }
    };

    fetchToken();
  }, []);

  return (
    <div>
      <div className="timer">{timer}</div>
      <button
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} />
      </button>
      <div className="status-indicator">{status}</div>
      {error && (
        <div className="error-message" style={{ display: "block" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
