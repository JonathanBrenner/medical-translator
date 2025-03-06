import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faStop } from "@fortawesome/free-solid-svg-icons";
import { getOpenAIToken, uploadAudio } from "../api";

const AudioRecorder = () => {
  const [error, setError] = useState("");
  const [tokenEn, setTokenEn] = useState(null);
  const [tokenEs, setTokenEs] = useState(null);
  const [userMedia, setUserMedia] = useState(null);
  const [offer, setOffer] = useState(null);
  const [sdpResponse, setSdpResponse] = useState(null);
  const [answer, setAnswer] = useState(null);

  const peerConnection = useRef(null);

  useEffect(() => {
    const fetchTokenEn = async () => {
      const tokenData = await getOpenAIToken("en");
      setTokenEn(tokenData);
    };

    fetchTokenEn();
  }, []);

  useEffect(() => {
    const fetchTokenEs = async () => {
      const tokenData = await getOpenAIToken("es");
      setTokenEs(tokenData);
    };

    fetchTokenEs();
  }, [tokenEn]);

  useEffect(() => {
    const pc = new RTCPeerConnection();
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);
    peerConnection.current = pc;

    const getUserMedia = async () => {
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      setUserMedia(ms);
    };
    getUserMedia();
  }, [tokenEs]);

  useEffect(() => {
    peerConnection.current.addTrack(userMedia.getTracks()[0]);
    const dc = peerConnection.current.createDataChannel("oai-events");
    dc.addEventListener("message", (e) => {
      console.log(e);
    });

    const getOffer = async () => {
      const offer = await peerConnection.current.createOffer();
      setOffer(offer);
    };
    getOffer();
  }, [userMedia]);

  useEffect(() => {
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview-2024-12-17";

    const getSdpResponse = async () => {
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });
      setSdpResponse(sdpResponse);
    };
    getSdpResponse();
  }, [offer]);

  useEffect(() => {
    const getAnswer = async () => {
      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      setAnswer(answer);
    };

    getAnswer();
  }, [sdpResponse]);

  useEffect(() => {
    peerConnection.current.setRemoteDescription(answer);
  }, [answer]);

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
