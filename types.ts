
export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  apiVoiceName: string; // Map to Puck, Charon, Kore, Fenrir, Zephyr
  description?: string;
}

export enum VoiceStyle {
  Natural = 'Natural',
  Happy = 'Happy',
  Sad = 'Sad',
  Whisper = 'Whisper',
  Storyteller = 'Storyteller',
}

export interface AudioHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  blobUrl: string;
  voiceName: string;
  style: string;
  duration?: number;
}

export interface TTSConfig {
  voiceId: string;
  style: VoiceStyle;
  speed: number; // 0.5 to 2.0
  pitch: number; // -10 to 10
}

export interface NarrativeConfig {
  customPrompt: string;
  youtubeLinks: string[];
}
