
import { GoogleGenAI, Modality } from '@google/genai';
import { TTSConfig, VoiceStyle, NarrativeConfig } from '../types';
import { VOICES } from '../constants';
import { createWavBlob, base64ToFloat32Array } from '../utils';

/**
 * Generates speech audio from text using Gemini TTS.
 */
export const generateSpeech = async (
  text: string,
  config: TTSConfig
): Promise<{ blob: Blob; url: string }> => {
  // Instantiate inside the function to use the most recent API key from the context
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const selectedVoice = VOICES.find(v => v.id === config.voiceId) || VOICES[0];

  let speedDesc = 'normal';
  if (config.speed < 0.8) speedDesc = 'very slow';
  else if (config.speed < 1.0) speedDesc = 'slow';
  else if (config.speed > 1.5) speedDesc = 'very fast';
  else if (config.speed > 1.2) speedDesc = 'fast';

  let pitchDesc = 'normal';
  if (config.pitch < -5) pitchDesc = 'very deep/low';
  else if (config.pitch < -2) pitchDesc = 'low';
  else if (config.pitch > 5) pitchDesc = 'very high/squeaky';
  else if (config.pitch > 2) pitchDesc = 'high';

  const promptText = `
    Please generate audio speech for the text below.
    
    Voice Persona: ${selectedVoice.name}
    Voice Profile: ${selectedVoice.description}

    Configuration:
    - Language: English (Strictly)
    - Tone/Style: ${config.style}
    - Speaking Rate: ${speedDesc}
    - Pitch/Timbre: ${pitchDesc}
    
    Sound Effect & Style Instructions:
    1. Functional Tags:
       - [Pause]: Insert approximately 2 seconds of silence.
       - [Laugh]: Perform a laughing sound or read with laughter.
       - [Scream]: Speak the adjacent text in a loud, screaming, energetic manner.
       - [Cry]: Speak with a crying/sobbing tone.
    
    2. Walkie Talkie Effect:
       - Any text enclosed in square brackets [...] that is NOT a functional tag (e.g., [Alpha Team, come in], [Target sighted], [Over and out]) must be spoken with a distinct Walkie Talkie / Radio static distortion effect.
    
    Text to read:
    "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
              voiceName: selectedVoice.apiVoiceName as any
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini API");
    }

    const float32Data = base64ToFloat32Array(base64Audio);
    const wavBlob = createWavBlob(float32Data, 24000);
    const blobUrl = URL.createObjectURL(wavBlob);

    return { blob: wavBlob, url: blobUrl };

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

/**
 * Analyzes a PDF and generates a story using search grounding for YouTube style analysis.
 */
export const generateStoryFromPdf = async (
  base64Pdf: string, 
  narrativeConfig: NarrativeConfig
): Promise<string> => {
  // Instantiate inside the function to use the most recent API key from the context
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const { customPrompt, youtubeLinks } = narrativeConfig;
    
    const validLinks = youtubeLinks.filter(l => l.trim() !== '');
    const linksContext = validLinks.length > 0
      ? `\n\nCRITICAL STYLE INSTRUCTIONS:
Before generating the story based on the PDF, use the googleSearch tool to research and analyze the narrative style, tone, pacing, and vocabulary of the following YouTube sources. Learn how they structure their "True Crime" storytelling:
${validLinks.join('\n')}

Once you have mastered their style, apply it to the content extracted from the provided PDF, following the core prompt provided below.`
      : '';

    // Combining instructions: YouTube analysis instructions first, then the user's documentarian prompt.
    const finalPrompt = `${linksContext}\n\nCORE NARRATIVE PROMPT:\n${customPrompt}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf
            }
          },
          {
            text: finalPrompt
          }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }],
        // Using thinking budget to handle complex style synthesis and long-form narrative generation
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Could not extract text from PDF or generate story.");
    return text;
  } catch (error) {
    console.error("Error analyzing PDF and generating story:", error);
    throw error;
  }
};
