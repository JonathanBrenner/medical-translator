import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faStop } from "@fortawesome/free-solid-svg-icons";
import { getOpenAIToken, uploadAudio } from "../api";

const AudioRecorder = () => {
  const [error, setError] = useState("");
  // const [tokenEn, setTokenEn] = useState(null);
  // const [tokenEs, setTokenEs] = useState(null);
  // const [userMedia, setUserMedia] = useState(null);
  // const [offer, setOffer] = useState(null);
  // const [sdpResponse, setSdpResponse] = useState(null);
  // const [answer, setAnswer] = useState(null);

  // const peerConnection = useRef(null);

  useEffect(() => {
    const setupAudioConnection = async () => {
      const tokenEn = await getOpenAIToken("en");
      const EPHEMERAL_KEY = tokenEn.value;
      // const tokenEs = await getOpenAIToken("es");

      const pc = new RTCPeerConnection();
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });

      pc.addTrack(ms.getTracks()[0]);
      const dc = pc.createDataChannel("oai-events");
      dc.addEventListener("message", (e) => {
        console.log(e);
      });

      const offer = await pc.createOffer();
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-mini-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
    };

    setupAudioConnection();
  }, []);

  return (
    <div>
      {error && (
        <div className="error-message" style={{ display: "block" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
