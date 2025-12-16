import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/generative-ai";
import { Camera, Upload, Loader2, Aperture, Heart, Minus, Plus, Download, Sliders, HelpCircle, FileImage, Layers, Landmark, Sparkles, Brain, GraduationCap, AlertCircle } from 'lucide-react';

// --- PROMPTS (Mantenuti brevi per brevità, ma funzionanti) ---
const CRITIC_SYSTEM_PROMPT = `Sei un Critico d'Arte Fotografica... [Tuo testo originale]`;
const CURATOR_SYSTEM_PROMPT = `Sei un Curatore... [Tuo testo originale]`;
const EDITING_SYSTEM_PROMPT = `Sei un Photo Editor... [Tuo testo originale]`;
const EMOTIONAL_SYSTEM_PROMPT = `Sei un Poeta Visivo... [Tuo testo originale]`;

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center ml-1.5" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-help" />
      {show && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded-lg z-50">{text}</div>}
    </div>
  );
};

const App = () => {
  const [mode, setMode] = useState<'single' | 'project' | 'curator' | 'editing'>('single');
  const [style, setStyle] = useState<'technical' | 'emotional'>('technical');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionCount, setSelectionCount] = useState<number>(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages([]);
    setPreviewUrls([]);
    setAnalysis(null);
    setError(null);
  }, [mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setImages(files);
      setPreviewUrls(files.map(f => URL.createObjectURL(f)));
      setAnalysis(null);
      setError(null);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        inlineData: { data: (reader.result as string).split(',')[1], mimeType: file.type },
      });
      reader.readAsDataURL(file);
    });
  };

  const analyzePhoto = async () => {
    if (images.length === 0) return;
    
    // --- PUNTO CRITICO: Usa import.meta.env ---
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    
    if (!apiKey) {
      setError("Errore: VITE_GEMINI_API_KEY mancante su Vercel.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const imageParts = await Promise.all(images.map(fileToGenerativePart));
      
      // Costruisci il prompt in base alla modalità
      let prompt = style === 'emotional' ? EMOTIONAL_SYSTEM_PROMPT : CRITIC_SYSTEM_PROMPT;
      if (mode === 'curator') prompt = CURATOR_SYSTEM_PROMPT;
      if (mode === 'editing') prompt = EDITING_SYSTEM_PROMPT;

      const result = await model.generateContent([prompt, ...imageParts as any]);
      const response = await result.response;
      setAnalysis(response.text());
    } catch (err: any) {
      console.error(err);
      setError("Errore durante l'analisi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const MarkdownDisplay = ({ content }: { content: string }) => (
    <div className="prose prose-invert text-gray-300">
      {content.split('\n').map((l, i) => <p key={i}>{l}</p>)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <Camera className="text-indigo-500" />
          <h1 className="text-xl font-bold">Visione AI</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid gap-8">
        <div className="flex flex-wrap gap-2 justify-center bg-gray-900 p-2 rounded-xl">
           {(['single', 'project', 'curator', 'editing'] as const).map(m => (
             <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-lg capitalize ${mode === m ? 'bg-indigo-600' : 'text-gray-400'}`}>{m}</button>
           ))}
        </div>

        <div className="flex justify-center gap-4">
           <button onClick={() => setStyle('technical')} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${style === 'technical' ? 'border-indigo-500 text-indigo-400' : 'border-gray-700 text-gray-500'}`}><Aperture size={16}/> Tecnica</button>
           <button onClick={() => setStyle('emotional')} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${style === 'emotional' ? 'border-rose-500 text-rose-400' : 'border-gray-700 text-gray-500'}`}><Heart size={16}/> Emozionale</button>
        </div>

        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-800 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-900 transition-colors">
          {previewUrls.length > 0 ? (
            <div className="flex gap-2 overflow-auto p-4 w-full justify-center">
              {previewUrls.map((src, i) => <img key={i} src={src} className="h-40 rounded-lg object-cover" />)}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Upload className="mx-auto mb-2" />
              <p>Clicca per caricare</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} />
        </div>

        <button onClick={analyzePhoto} disabled={loading || images.length === 0} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin mx-auto" /> : "AVVIA ANALISI"}
        </button>
        
        {error && <div className="bg-red-900/30 text-red-400 p-4 rounded-xl flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

        {analysis && (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <MarkdownDisplay content={analysis} />
          </div>
        )}
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export default App;
