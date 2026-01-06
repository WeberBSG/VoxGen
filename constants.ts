
import { VoiceOption, VoiceStyle } from './types';

// Gemini currently offers 5 prebuilt voices: Puck, Charon, Kore, Fenrir, Zephyr.
// We map UI options to these 5, using prompt engineering instructions to differentiate variants.
export const VOICES: VoiceOption[] = [
  // Male Voices
  { id: 'm1', name: 'James (Deep)', gender: 'Male', apiVoiceName: 'Fenrir', description: 'Deep & Authoritative' },
  { id: 'm2', name: 'Robert (Soft)', gender: 'Male', apiVoiceName: 'Puck', description: 'Soft & Casual' },
  { id: 'm3', name: 'Michael (Steady)', gender: 'Male', apiVoiceName: 'Charon', description: 'Steady & News-like' },
  { id: 'm4', name: 'David (Energetic)', gender: 'Male', apiVoiceName: 'Puck', description: 'Upbeat & Fast' },
  { id: 'm5', name: 'William (Calm)', gender: 'Male', apiVoiceName: 'Fenrir', description: 'Calm & Reassuring' },
  { id: 'm6', name: 'Marcus (Storyteller)', gender: 'Male', apiVoiceName: 'Fenrir', description: 'Very Deep, Calm & Epic' },
  { id: 'm7', name: 'Arthur (British Deep)', gender: 'Male', apiVoiceName: 'Fenrir', description: '40 years old male, thick, deep, narrative voice, English accent' },
  
  // Female Voices
  { id: 'f1', name: 'Emily (Clear)', gender: 'Female', apiVoiceName: 'Kore', description: 'Clear & Professional' },
  { id: 'f2', name: 'Sarah (Bright)', gender: 'Female', apiVoiceName: 'Zephyr', description: 'Bright & Friendly' },
  { id: 'f3', name: 'Jessica (Warm)', gender: 'Female', apiVoiceName: 'Kore', description: 'Warm & Motherly' },
  { id: 'f4', name: 'Jennifer (Crisp)', gender: 'Female', apiVoiceName: 'Zephyr', description: 'Crisp & Modern' },
  { id: 'f5', name: 'Linda (Soft)', gender: 'Female', apiVoiceName: 'Kore', description: 'Soft & Gentle' },
];

export const STYLES: VoiceStyle[] = [
  VoiceStyle.Natural,
  VoiceStyle.Happy,
  VoiceStyle.Sad,
  VoiceStyle.Whisper,
  VoiceStyle.Storyteller,
];

export const EXAMPLE_TAGS = [
  { tag: '[Pause]', desc: 'Pause for 2 seconds' },
  { tag: '[Laugh]', desc: 'Insert laughter' },
  { tag: '[Scream]', desc: 'Energetic/Loud' },
  { tag: '[Cry]', desc: 'Crying tone' },
  { tag: '[Radio]', desc: 'Walkie-talkie effect' },
];
