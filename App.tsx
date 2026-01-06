
import React, { useState, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { HistoryItem } from './components/HistoryItem';
import { TTSConfig, VoiceStyle, AudioHistoryItem, NarrativeConfig } from './types';
import { VOICES, EXAMPLE_TAGS } from './constants';
import { generateSpeech, generateStoryFromPdf } from './services/geminiService';
import { fileToBase64 } from './utils';
import { 
  Wand2, History, Type, Info, FileUp, FileDown, 
  Loader2, Youtube, Settings2, Save, CheckCircle2, 
  Trash2, PlusCircle, Sun, Moon 
} from 'lucide-react';

const DEFAULT_PROMPT = `Role: You are a Professional True Crime Documentarian. Your goal is to provide a high-detail, long-form narrative based on the provided PDF.

Task: Convert the FBI file into a full-length story (target: 2000 words).

Narrative Structure (STRICTLY FOLLOW THIS):

The Atmospheric Hook: Start with a 3-paragraph immersion into the setting and the psychological contrast (Gonzok style).

Chronological Deep-Dive: Do not skip periods of time. Use the PDF to describe the investigation step-by-step.

The "Micro-Stories": For every 5 pages of the PDF, extract at least one specific detail, a witness quote, or a piece of evidence (e.g., the specific caliber of a gun, the color of a car, the exact time of a phone call) and expand on it.

Internal Monologues & Atmosphere: Describe the weather, the smells, and the specific frustrations of the FBI agents mentioned in the files.

Expanded Climax: The "escape" or "crime" sequence must be described in extreme detail, minute by minute.

STRICT INSTRUCTIONS for Length:

NEVER summarize. If the PDF mentions a search, describe the dogs, the helicopters, and the mud.

If the PDF mentions a document, describe the font, the ink, and the desk it sat on.

Format: Output ONLY plain text. No bold, no headers, no scene directions. Just the story ready for TTS.

Language: English.`;

const CHUNK_SIZE = 2000;

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [chunks, setChunks] = useState<string[]>(['Hello! Use tags like [Laugh] to change how I speak.']);
  const [chunkLoading, setChunkLoading] = useState<boolean[]>([]);
  
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  const [customPrompt, setCustomPrompt] = useState<string>(DEFAULT_PROMPT);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>(['', '', '', '', '', '']);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importJsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedPrompt = localStorage.getItem('voxgen_custom_prompt');
    const savedLinks = localStorage.getItem('voxgen_youtube_links');
    const savedMode = localStorage.getItem('voxgen_dark_mode');
    
    if (savedPrompt) setCustomPrompt(savedPrompt);
    if (savedLinks) {
      try {
        const parsed = JSON.parse(savedLinks);
        if (Array.isArray(parsed)) setYoutubeLinks(parsed);
      } catch (e) { console.error("Failed to parse saved links", e); }
    }
    if (savedMode !== null) setDarkMode(savedMode === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('voxgen_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [config, setConfig] = useState<TTSConfig>({
    voiceId: 'm7', // Arthur (British Deep)
    style: VoiceStyle.Natural,
    speed: 1.0,
    pitch: 0,
  });

  const [history, setHistory] = useState<AudioHistoryItem[]>([]);

  const splitIntoChunks = (text: string): string[] => {
    const result: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= CHUNK_SIZE) {
        result.push(remaining.trim());
        break;
      }
      let splitIndex = remaining.lastIndexOf(' ', CHUNK_SIZE);
      if (splitIndex === -1 || splitIndex < CHUNK_SIZE * 0.8) {
        splitIndex = CHUNK_SIZE;
      }
      result.push(remaining.substring(0, splitIndex).trim());
      remaining = remaining.substring(splitIndex).trim();
    }
    return result.length > 0 ? result : [text];
  };

  const handleChunkChange = (index: number, value: string) => {
    const newChunks = [...chunks];
    newChunks[index] = value;
    setChunks(newChunks);
  };

  const addChunk = () => setChunks([...chunks, '']);
  const removeChunk = (index: number) => {
    if (chunks.length === 1) { setChunks(['']); return; }
    setChunks(chunks.filter((_, i) => i !== index));
  };

  const insertTag = (index: number, tag: string) => {
    const newChunks = [...chunks];
    newChunks[index] = newChunks[index] + " " + tag + " ";
    setChunks(newChunks);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('voxgen_custom_prompt', customPrompt);
    localStorage.setItem('voxgen_youtube_links', JSON.stringify(youtubeLinks));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportJson = () => {
    const dataToExport = {
      youtubeLinks,
      customPrompt,
      chunks,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxgen_project_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.youtubeLinks) setYoutubeLinks(json.youtubeLinks);
        if (json.customPrompt) setCustomPrompt(json.customPrompt);
        if (json.chunks) {
          setChunks(json.chunks);
          setChunkLoading(new Array(json.chunks.length).fill(false));
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (err) { setError('Failed to parse JSON file.'); }
    };
    reader.readAsText(file);
    if (importJsonInputRef.current) importJsonInputRef.current.value = '';
  };

  const handleGenerateChunk = async (index: number) => {
    const textToSpeak = chunks[index];
    if (!textToSpeak.trim()) return;
    const newLoading = [...chunkLoading];
    newLoading[index] = true;
    setChunkLoading(newLoading);
    setError(null);
    try {
      const { url } = await generateSpeech(textToSpeak, config);
      const voiceName = VOICES.find(v => v.id === config.voiceId)?.name || 'Unknown Voice';
      const newItem: AudioHistoryItem = {
        id: crypto.randomUUID(),
        text: `Part ${index + 1}: ` + textToSpeak.substring(0, 40) + (textToSpeak.length > 40 ? '...' : ''),
        timestamp: Date.now(),
        blobUrl: url,
        voiceName,
        style: config.style,
      };
      setHistory(prev => [newItem, ...prev]);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating speech.');
    } finally {
      const resetLoading = [...chunkLoading];
      resetLoading[index] = false;
      setChunkLoading(resetLoading);
    }
  };

  const handlePreviewVoice = async (voiceId: string) => {
    if (previewLoading) return;
    setPreviewLoading(true);
    setError(null);
    try {
      // Use the current config values for Style, Speed, and Pitch to ensure live testing
      const previewConfig: TTSConfig = { 
        ...config, 
        voiceId 
      };
      const { url } = await generateSpeech("Hello, this is a test of the current voice settings.", previewConfig);
      const audio = new Audio(url);
      await audio.play();
    } catch (err: any) { console.error("Preview failed", err); }
    finally { setPreviewLoading(false); }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    setPdfLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const storyText = await generateStoryFromPdf(base64, { customPrompt, youtubeLinks });
      const newChunks = splitIntoChunks(storyText);
      setChunks(newChunks);
      setChunkLoading(new Array(newChunks.length).fill(false));
    } catch (err: any) { setError(err.message || 'Failed to process PDF.'); }
    finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...youtubeLinks];
    newLinks[index] = value;
    setYoutubeLinks(newLinks);
  };

  const themeClasses = darkMode 
    ? "bg-slate-950 text-slate-200" 
    : "bg-slate-50 text-slate-900";

  const cardClasses = darkMode
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-slate-200 shadow-sm";

  const inputClasses = darkMode
    ? "bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-500"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400";

  const headerClasses = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200 shadow-sm";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${themeClasses} pb-12`}>
      <header className={`${headerClasses} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shrink-0">
              <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                VoxGen AI
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 tracking-wide uppercase">Story Engine</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'}`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleExportJson}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
            >
              <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button 
              onClick={() => importJsonInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
            >
              <FileUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input type="file" ref={importJsonInputRef} onChange={handleImportJson} accept="application/json" className="hidden" />
            
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition border ${showAdvanced ? 'bg-indigo-600 border-indigo-600 text-white' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')}`}
            >
              <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {showAdvanced ? 'Hide Config' : 'Style Config'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          
          {showAdvanced && (
            <div className={`p-4 sm:p-6 rounded-xl border shadow-xl space-y-6 animate-in slide-in-from-top duration-300 ${darkMode ? 'bg-slate-800 border-indigo-500/30' : 'bg-white border-indigo-100'}`}>
              <div>
                <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  YouTube Style Analysis
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {youtubeLinks.map((link, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`YouTube URL ${idx + 1}`}
                      value={link}
                      onChange={(e) => handleLinkChange(idx, e.target.value)}
                      className={`w-full border rounded-md p-2 text-xs sm:text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition ${inputClasses}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  Custom Prompt
                </h3>
                <textarea
                  className={`w-full h-40 sm:h-48 border rounded-lg p-3 text-[10px] sm:text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition ${inputClasses}`}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                   <p className="text-[10px] sm:text-xs text-slate-500 italic">Settings are saved locally.</p>
                   <button 
                    onClick={handleSaveSettings}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-md active:scale-95"
                  >
                    {saveSuccess ? (
                      <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Config</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Type className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              Script Parts
            </h2>
            <div className="w-full sm:w-auto">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 shadow-md"
              >
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                {pdfLoading ? "Thinking..." : "PDF to Story"}
              </button>
              <input type="file" ref={fileInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
            </div>
          </div>

          {error && <div className="p-3 bg-red-900/20 border border-red-800 text-red-200 rounded-lg text-xs sm:text-sm">{error}</div>}

          <div className="space-y-6">
            {chunks.map((chunkText, idx) => (
              <div key={idx} className={`p-4 sm:p-6 rounded-xl border shadow-lg flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${cardClasses}`}>
                <div className="flex justify-between items-center">
                  <span className="bg-indigo-600/10 text-indigo-500 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border border-indigo-500/20">
                    PART {idx + 1}
                  </span>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`text-[10px] sm:text-xs ${chunkText.length > CHUNK_SIZE ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                      {chunkText.length} / {CHUNK_SIZE}
                    </span>
                    <button 
                      onClick={() => removeChunk(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  className={`w-full h-32 sm:h-40 border rounded-lg p-3 sm:p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none leading-relaxed text-xs sm:text-sm transition ${inputClasses}`}
                  placeholder={`Script for part ${idx + 1}...`}
                  value={chunkText}
                  onChange={(e) => handleChunkChange(idx, e.target.value)}
                  disabled={chunkLoading[idx]}
                />

                <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Tags:</span>
                  {EXAMPLE_TAGS.map((t) => (
                    <button
                      key={t.tag}
                      onClick={() => insertTag(idx, t.tag)}
                      disabled={chunkLoading[idx]}
                      className={`px-2 py-1 rounded border text-[9px] sm:text-[10px] transition disabled:opacity-50 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleGenerateChunk(idx)}
                  disabled={chunkLoading[idx] || !chunkText.trim()}
                  className={`w-full py-2.5 sm:py-3 rounded-lg font-bold text-white text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 sm:gap-3 ${chunkLoading[idx] ? 'bg-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/20'}`}
                >
                  {chunkLoading[idx] ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                  ) : (
                    <><Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Generate Part {idx + 1}</>
                  )}
                </button>
              </div>
            ))}
            
            <button 
              onClick={addChunk}
              className={`w-full py-3 sm:py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all group ${darkMode ? 'border-slate-800 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-slate-900/50' : 'border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50'}`}
            >
              <PlusCircle className="w-4 h-4 sm:w-5 h-5 group-hover:scale-110 transition-transform" />
              Add Script Part
            </button>
          </div>

          <ControlPanel config={config} onChange={setConfig} onPreviewVoice={handlePreviewVoice} isPreviewing={previewLoading} disabled={pdfLoading} darkMode={darkMode} />
        </div>

        <div className="lg:col-span-5">
          <div className={`p-4 sm:p-6 rounded-xl border shadow-xl flex flex-col min-h-[400px] lg:sticky lg:top-24 transition-colors ${cardClasses}`}>
            <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6 border-b pb-2 ${darkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              Audio History
            </h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[70vh] lg:max-h-none">
              {history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                    <History className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500" />
                  </div>
                  <p className="text-xs sm:text-sm">No audio generated yet</p>
                </div>
              ) : (
                history.map((item) => <HistoryItem key={item.id} item={item} onDelete={(id) => setHistory(history.filter(h => h.id !== id))} darkMode={darkMode} />)
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
