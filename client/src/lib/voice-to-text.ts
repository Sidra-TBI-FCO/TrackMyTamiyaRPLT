interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Voice-to-text transcription utilities
 * Supports both Web Speech API (browser-based) and server-side transcription
 */
export class VoiceToText {
  private static readonly DEFAULT_LANGUAGE = 'en-US';
  private static readonly SUPPORTED_LANGUAGES = [
    'en-US', 'en-GB', 'ja-JP', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR'
  ];

  /**
   * Check if Web Speech API is supported
   */
  static isWebSpeechSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Transcribe audio blob using available methods
   */
  static async transcribeAudio(audioBlob: Blob, options: TranscriptionOptions = {}): Promise<string> {
    const { language = this.DEFAULT_LANGUAGE } = options;

    // Try server-side transcription first (more reliable)
    try {
      const serverTranscription = await this.transcribeOnServer(audioBlob, language);
      if (serverTranscription) {
        return serverTranscription;
      }
    } catch (error) {
      console.warn('Server transcription failed, trying browser fallback:', error);
    }

    // Fallback to browser-based transcription
    if (this.isWebSpeechSupported()) {
      try {
        return await this.transcribeWithWebSpeech(audioBlob, options);
      } catch (error) {
        console.warn('Web Speech API failed:', error);
      }
    }

    throw new Error('No transcription method available');
  }

  /**
   * Server-side transcription using speech-to-text API
   */
  private static async transcribeOnServer(audioBlob: Blob, language: string): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    return result.text || '';
  }

  /**
   * Browser-based transcription using Web Speech API
   * Note: This works with live audio, not audio blobs, so we need to play the audio
   */
  private static async transcribeWithWebSpeech(
    audioBlob: Blob, 
    options: TranscriptionOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const {
        language = this.DEFAULT_LANGUAGE,
        continuous = false,
        interimResults = false
      } = options;

      // @ts-ignore - SpeechRecognition types
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech Recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      let finalTranscript = '';
      let timeout: NodeJS.Timeout;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        
        // Play the audio blob to trigger recognition
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audio.play().catch(error => {
          console.warn('Audio playback failed:', error);
          reject(new Error('Failed to play audio for transcription'));
        });

        // Set timeout for transcription
        timeout = setTimeout(() => {
          recognition.stop();
          if (!finalTranscript) {
            reject(new Error('Transcription timeout'));
          }
        }, 30000); // 30 second timeout
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // If we have a final result, resolve immediately
        if (finalTranscript) {
          clearTimeout(timeout);
          resolve(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        clearTimeout(timeout);
        console.error('Speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      recognition.onend = () => {
        clearTimeout(timeout);
        if (finalTranscript) {
          resolve(finalTranscript.trim());
        } else {
          reject(new Error('No speech detected'));
        }
      };

      recognition.start();
    });
  }

  /**
   * Real-time speech recognition (for live recording)
   */
  static startLiveTranscription(
    onResult: (result: TranscriptionResult) => void,
    onError: (error: string) => void,
    options: TranscriptionOptions = {}
  ): () => void {
    if (!this.isWebSpeechSupported()) {
      onError('Speech Recognition not supported in this browser');
      return () => {};
    }

    const {
      language = this.DEFAULT_LANGUAGE,
      continuous = true,
      interimResults = true
    } = options;

    // @ts-ignore - SpeechRecognition types
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      console.log('Live transcription started');
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0];
        onResult({
          text: result.transcript,
          confidence: result.confidence,
          isFinal: event.results[i].isFinal
        });
      }
    };

    recognition.onerror = (event) => {
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('Live transcription ended');
    };

    recognition.start();

    // Return stop function
    return () => {
      recognition.stop();
    };
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): string[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * Validate language code
   */
  static isLanguageSupported(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(language);
  }
}

// Convenience functions
export async function transcribeAudio(audioBlob: Blob, language = 'en-US'): Promise<string> {
  return VoiceToText.transcribeAudio(audioBlob, { language });
}

export function startLiveTranscription(
  onResult: (result: TranscriptionResult) => void,
  onError: (error: string) => void,
  language = 'en-US'
): () => void {
  return VoiceToText.startLiveTranscription(onResult, onError, { language });
}

export function isVoiceToTextSupported(): boolean {
  return VoiceToText.isWebSpeechSupported();
}
