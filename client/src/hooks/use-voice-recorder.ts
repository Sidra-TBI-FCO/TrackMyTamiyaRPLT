import { useState, useRef, useCallback, useEffect } from "react";
import { transcribeAudio } from "@/lib/voice-to-text";

interface UseVoiceRecorderOptions {
  onRecordingComplete?: (recording: { blob: Blob; url: string; duration: number }) => void;
  onTranscription?: (text: string) => void;
}

interface VoiceRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000);
        setRecordingTime(elapsed);
      }
    }, 1000);
  }, [isPaused]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      pausedDurationRef.current = 0;
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus'
          : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        const url = URL.createObjectURL(blob);
        const duration = recordingTime;

        setAudioBlob(blob);
        setAudioUrl(url);

        const recording = { blob, url, duration };
        options.onRecordingComplete?.(recording);

        // Start transcription if callback provided
        if (options.onTranscription) {
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudio(blob);
            options.onTranscription(transcription);
          } catch (error) {
            console.error('Transcription failed:', error);
            setError('Failed to transcribe audio');
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  }, [options, recordingTime, startTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedDurationRef.current += Date.now() - startTimeRef.current;
      stopTimer();
    }
  }, [isRecording, isPaused, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimeRef.current = Date.now();
      startTimer();
    }
  }, [isRecording, isPaused, startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();

      // Stop all tracks in the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording, stopTimer]);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setError(null);
    pausedDurationRef.current = 0;
    chunksRef.current = [];
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [stopTimer, audioUrl]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    isTranscribing,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording
  };
}
