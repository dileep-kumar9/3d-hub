"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type NewsSpeechRequest = {
  id: string;
  label: string;
  text: string;
};

type Props = {
  request: NewsSpeechRequest | null;
  onClose: () => void;
};

const LANGUAGE_OPTIONS = [
  { value: "en-IN", label: "English" },
  { value: "te-IN", label: "Telugu" },
  { value: "hi-IN", label: "Hindi" },
] as const;

const RATE_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

export default function NewsAudioPlayer({
  request,
  onClose,
}: Props) {
  const [supported, setSupported] =
    useState(true);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [language, setLanguage] =
    useState("en-IN");
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const utteranceRef =
    useRef<SpeechSynthesisUtterance | null>(
      null
    );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      setVoices(
        window.speechSynthesis.getVoices()
      );
    };

    loadVoices();
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );
    };
  }, []);

  const selectedVoice = useMemo(() => {
    const exact = voices.find(
      (voice) => voice.lang === language
    );

    if (exact) return exact;

    const prefix = language
      .split("-")[0]
      .toLowerCase();

    return voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(prefix)
    );
  }, [language, voices]);

  function startSpeaking() {
    if (
      !request?.text.trim() ||
      !supported ||
      typeof window === "undefined"
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        request.text.trim()
      );

    utterance.lang = language;
    utterance.rate = rate;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setPlaying(true);
      setPaused(false);
    };

    utterance.onpause = () => {
      setPaused(true);
    };

    utterance.onresume = () => {
      setPaused(false);
      setPlaying(true);
    };

    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };

    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function togglePlayback() {
    if (
      typeof window === "undefined" ||
      !supported
    ) {
      return;
    }

    if (!playing) {
      startSpeaking();
      return;
    }

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }

    setPlaying(false);
    setPaused(false);
  }

  function closePlayer() {
    stopSpeaking();
    onClose();
  }

  useEffect(() => {
    if (!request) {
      stopSpeaking();
      return;
    }

    startSpeaking();
    // The request id intentionally starts a new narration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  useEffect(() => {
    if (!request || !playing) return;
    startSpeaking();
    // Restart narration when voice or speed changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, rate]);

  if (!request) return null;

  return (
    <aside
      className="news-audio-player"
      aria-label="News audio player"
    >
      <div className="news-audio-copy">
        <span>Listening to</span>
        <strong>{request.label}</strong>
      </div>

      {!supported ? (
        <p className="news-audio-unsupported">
          Text-to-speech is not available in this
          browser.
        </p>
      ) : (
        <div className="news-audio-controls">
          <button
            type="button"
            onClick={togglePlayback}
            className="news-audio-primary"
          >
            {!playing || paused ? "Play" : "Pause"}
          </button>

          <button
            type="button"
            onClick={stopSpeaking}
          >
            Stop
          </button>

          <label>
            <span>Voice</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Speed</span>
            <select
              value={rate}
              onChange={(event) =>
                setRate(Number(event.target.value))
              }
            >
              {RATE_OPTIONS.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}x
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={closePlayer}
            aria-label="Close news audio player"
            title="Close"
          >
            ✕
          </button>
        </div>
      )}
    </aside>
  );
}
