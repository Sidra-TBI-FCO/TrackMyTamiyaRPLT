import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Play, Pause, Square, Trash2 } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecordingComplete?: (recording: { blob: Blob; url: string; duration: number }) => void;
  onTranscription?: (text: string) => void;
  className?: string;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onTranscription,
  className
}: VoiceRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
    error
  } = useVoiceRecorder({
    onRecordingComplete,
    onTranscription
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    if (!audioUrl) return;

    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('pause', () => setIsPlaying(false));
    
    audio.play();
    setAudioElement(audio);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const handleClear = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      setAudioElement(null);
    }
    clearRecording();
  };

  return (
    <Card className={cn("bg-white dark:bg-gray-800", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Recording Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isRecording && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                {isRecording 
                  ? isPaused 
                    ? "Recording paused" 
                    : "Recording..."
                  : audioBlob 
                    ? "Recording complete"
                    : "Ready to record"
                }
              </span>
            </div>
            
            {(isRecording || audioBlob) && (
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {formatTime(recordingTime)}
              </span>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-2">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 text-white font-mono flex-1"
                disabled={!!error}
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                <Button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  variant="outline"
                  className="font-mono"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                
                <Button
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-mono flex-1"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              </>
            )}

            {audioBlob && !isRecording && (
              <>
                <Button
                  onClick={isPlaying ? handlePause : handlePlay}
                  variant="outline"
                  className="font-mono"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 font-mono"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white font-mono"
                >
                  <MicOff className="mr-2 h-4 w-4" />
                  Record Again
                </Button>
              </>
            )}
          </div>

          {/* Waveform Visualization Placeholder */}
          {isRecording && (
            <div className="flex items-center justify-center h-12 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex items-end space-x-1">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 32 + 8}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Audio Preview */}
          {audioUrl && !isRecording && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
              <audio controls className="w-full h-8">
                <source src={audioUrl} type="audio/webm" />
                <source src={audioUrl} type="audio/mp4" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Instructions */}
          {!isRecording && !audioBlob && !error && (
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 text-center">
              Click to start recording your build notes. The recording will be automatically transcribed.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
