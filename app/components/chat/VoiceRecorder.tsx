"use client";

import { useCallback, useRef, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";

const VOICE_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

type Props = {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
};

export default function VoiceRecorder({ onSend, onCancel }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useLocale();

  const sendOnStopRef = useRef(false);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = VOICE_MIME_TYPES.find((type) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      sendOnStopRef.current = false;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        if (!sendOnStopRef.current) return;
        sendOnStopRef.current = false;
        const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) onSend(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch { /* mic denied */ }
  }, [onSend]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const send = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      sendOnStopRef.current = true;
      stop();
      return;
    }
    const type = (recorder?.mimeType || "audio/webm").split(";")[0];
    const blob = new Blob(chunksRef.current, { type });
    if (blob.size > 0) onSend(blob);
  }, [stop, onSend]);

  return <div className="voice-recorder">
    {!recording ? (
      <button className="voice-recorder-btn" onClick={start} type="button">
        <span className="material-symbols-rounded">mic</span>
        {t("chatVoice")}
      </button>
    ) : (
      <>
        <div className="voice-recorder-pulse" />
        <span className="voice-recorder-time">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span>
        <button className="voice-recorder-btn voice-recorder-stop" onClick={stop} type="button">
          <span className="material-symbols-rounded">stop</span>
          {t("chatStop")}
        </button>
        <button className="voice-recorder-btn voice-recorder-send" onClick={send} type="button">
          <span className="material-symbols-rounded">send</span>
          {t("chatSendVoice")}
        </button>
        <button className="voice-recorder-btn voice-recorder-cancel" onClick={() => { stop(); onCancel(); }} type="button">
          <span className="material-symbols-rounded">close</span>
        </button>
      </>
    )}
  </div>;
}
