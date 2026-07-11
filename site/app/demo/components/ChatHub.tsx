"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatMessage, usePlatform } from "../PlatformContext";
import { Icon } from "./Icon";
import { useLocale } from "@/app/components/LocaleProvider";

const reactionOptions = ["🔥", "😂", "💚"];

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function ChatHub() {
  const { event, updateEvent, state, notify, gainXp } = usePlatform();
  const { t } = useLocale();
  const [threadId, setThreadId] = useState(event.threads[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [newThread, setNewThread] = useState("");
  const [showThreadForm, setShowThreadForm] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingSecondsRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeThread = event.threads.find((thread) => thread.id === threadId) ?? event.threads[0];

  useEffect(() => () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function appendMessage(nextMessage: ChatMessage) {
    if (!activeThread) return;
    updateEvent((current) => ({
      ...current,
      threads: current.threads.map((thread) => thread.id === activeThread.id ? { ...thread, messages: [...thread.messages, nextMessage] } : thread),
    }));
  }

  function sendMessage(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!message.trim()) return;
    appendMessage({ id: `msg_${Date.now()}`, authorId: state.profile.id, author: state.profile.name, text: message.trim(), createdAt: new Date().toISOString(), reactions: {} });
    setMessage("");
    gainXp(2, t("chatMsgSent"));
  }

  function createThread(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!newThread.trim()) return;
    const id = `thread_${Date.now()}`;
    updateEvent((current) => ({ ...current, threads: [...current.threads, { id, name: newThread.trim(), messages: [] }] }));
    setThreadId(id);
    setNewThread("");
    setShowThreadForm(false);
    notify(t("chatThreadReady"));
  }

  function toggleReaction(messageId: string, emoji: string) {
    if (!activeThread) return;
    updateEvent((current) => ({
      ...current,
      threads: current.threads.map((thread) => thread.id === activeThread.id ? {
        ...thread,
        messages: thread.messages.map((entry) => {
          if (entry.id !== messageId) return entry;
          const users = entry.reactions[emoji] ?? [];
          return { ...entry, reactions: { ...entry.reactions, [emoji]: users.includes(state.profile.id) ? users.filter((id) => id !== state.profile.id) : [...users, state.profile.id] } };
        }),
      } : thread),
    }));
  }

  async function startRecording() {
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      notify(t("chatNoSupport"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        const voiceUrl = await blobToDataUrl(blob);
        appendMessage({ id: `voice_${Date.now()}`, authorId: state.profile.id, author: state.profile.name, text: `${t("chatVoice")} · ${Math.max(1, recordingSecondsRef.current)} ${t("chatVoiceSec")}`, createdAt: new Date().toISOString(), reactions: {}, voiceUrl });
        gainXp(4, t("chatVoiceSent"));
        setRecordingSeconds(0);
      };
      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds((seconds) => {
          if (seconds >= 59) {
            recordingSecondsRef.current = 60;
            recorder.stop();
            setRecording(false);
            if (recordingTimer.current) clearInterval(recordingTimer.current);
            return 60;
          }
          recordingSecondsRef.current = seconds + 1;
          return seconds + 1;
        });
      }, 1000);
    } catch {
      notify(t("chatNoMic"));
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setRecording(false);
  }

  function removeThread() {
    if (!activeThread || event.threads[0]?.id === activeThread.id) return;
    updateEvent((current) => ({ ...current, threads: current.threads.filter((thread) => thread.id !== activeThread.id) }));
    setThreadId(event.threads[0].id);
    notify(t("chatThreadDeleted"));
  }

  return (
    <section className="demo-tab-panel demo-chat-panel">
      <div className="demo-panel-title"><div><span>{t("chatTitle")}</span><h2>{t("chatSub")}</h2></div><span className="demo-chip">{event.threads.reduce((sum, thread) => sum + thread.messages.length, 0)}</span></div>
      <div className="thread-bar scroll-row">
        {event.threads.map((thread) => <button className={activeThread?.id === thread.id ? "active" : ""} key={thread.id} onClick={() => setThreadId(thread.id)} type="button"># {thread.name}<span>{thread.messages.length}</span></button>)}
        <button className="new-thread-button" onClick={() => setShowThreadForm((value) => !value)} type="button"><Icon name="add" /> {t("chatThread")}</button>
        {activeThread && event.threads[0]?.id !== activeThread.id && <button className="remove-thread-button" onClick={removeThread} type="button"><Icon name="delete" /> {t("chatDeleteThread")}</button>}
      </div>
      {showThreadForm && <form className="thread-create-form" onSubmit={createThread}><input aria-label="Название нового треда" placeholder={t("chatThreadPlace")} value={newThread} onChange={(changeEvent) => setNewThread(changeEvent.target.value)} /><button type="submit">{t("chatCreate")}</button></form>}

      <div className="chat-stream" aria-live="polite">
        {activeThread?.messages.filter((entry) => entry.pinned).map((entry) => <article className="pinned-message" key={`pinned-${entry.id}`}><div><strong><Icon name="keep" /> {entry.author}</strong><time>{t("chatPinned")}</time></div><p>{entry.text}</p></article>)}
        {activeThread?.messages.map((entry) => (
          <article className={entry.authorId === state.profile.id ? "mine" : ""} key={entry.id}>
            <div><strong>{entry.author}</strong><time>{new Date(entry.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</time></div>
            <p>{entry.text}</p>
            {entry.voiceUrl && <audio aria-label={`${t("chatVoiceFrom")}${entry.author}`} controls src={entry.voiceUrl} />}
            <div className="message-actions">
              {reactionOptions.map((emoji) => <button className={(entry.reactions[emoji] ?? []).includes(state.profile.id) ? "active" : ""} key={emoji} onClick={() => toggleReaction(entry.id, emoji)} type="button">{emoji}<span>{(entry.reactions[emoji] ?? []).length || ""}</span></button>)}
              <button aria-label={entry.pinned ? t("chatUnpinMsg") : t("chatPinMsg")} onClick={() => updateEvent((current) => ({ ...current, threads: current.threads.map((thread) => thread.id === activeThread.id ? { ...thread, messages: thread.messages.map((message) => message.id === entry.id ? { ...message, pinned: !message.pinned } : message) } : thread) }))} type="button"><Icon name={entry.pinned ? "keep_off" : "keep"} /></button>
              {entry.authorId === state.profile.id && <button aria-label={t("chatDeleteMsg")} onClick={() => updateEvent((current) => ({ ...current, threads: current.threads.map((thread) => thread.id === activeThread.id ? { ...thread, messages: thread.messages.filter((message) => message.id !== entry.id) } : thread) }))} type="button"><Icon name="delete" /></button>}
            </div>
          </article>
        ))}
        {!activeThread?.messages.length && <div className="empty-state"><Icon name="forum" /><strong>{t("chatEmpty")}</strong><span>{t("chatEmptySub")}</span></div>}
      </div>
      {message && <div className="typing-indicator"><i /><span>{t("chatTyping")}</span></div>}
      <form className="demo-inline-form chat-form" onSubmit={sendMessage}>
        <input aria-label="Сообщение" placeholder={`${t("chatPlaceholder")}${activeThread?.name ?? "Общий"}…`} value={message} onChange={(changeEvent) => setMessage(changeEvent.target.value)} />
        <button className={recording ? "recording" : ""} onClick={(clickEvent) => { clickEvent.preventDefault(); if (recording) stopRecording(); else void startRecording(); }} type="button" aria-label={recording ? t("chatStopRecord") : t("chatStartRecord")}><Icon name={recording ? "stop_circle" : "mic"} />{recording && <span>{recordingSeconds}{t("chatVoiceSec")}</span>}</button>
        <button type="submit" aria-label="Отправить сообщение"><Icon name="send" /><span>{t("chatSend")}</span></button>
      </form>
    </section>
  );
}
