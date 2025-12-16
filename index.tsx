import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/generative-ai";
import { Camera, Upload, Image as ImageIcon, Loader2, Aperture, Palette, GraduationCap, AlertCircle, Layers, FileImage, Landmark, Minus, Plus, Download, Sliders, HelpCircle, Heart, Sparkles, Brain } from 'lucide-react';

// --- PROMPTS --- (Invariati per mantenere la tua logica di analisi)
const CRITIC_SYSTEM_PROMPT = `Sei un Critico d'Arte Fotografica di altissimo livello...`; // [Troncato per brevità, usa i tuoi testi originali]
const CURATOR_SYSTEM_PROMPT = `Sei un Direttore di Gallerie d'Arte...`; 
const EDITING_SYSTEM_PROMPT = `Sei un Master Retoucher...`;
const EMOTIONAL_SYSTEM_PROMPT = `Sei un Poeta Visivo...`;

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center ml-1.5" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help" />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg shadow-xl z-50 text-center">
          {text}
        </div>
      )}
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
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setAnalysis(null);
    setError(null);
    setSelectionCount(mode === 'curator' ? 3 : 1);
  }, [mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if ((mode === 'single' || mode === 'editing') && newFiles.length > 1) {
          setError("Carica solo una foto in questa modalità.");
          return;
      }
      setImages(newFiles);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
      setAnalysis(null);
      setError(null);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        inlineData: {
          data: (reader.result as string).split(',')[1],
          mimeType: file.type,
        },
      });
      reader.readAsDataURL(file);
    });
  };

  const analyzePhoto = async () => {
    if (images.length === 0) return;
    
    // Verifica API Key immediata
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Errore: API Key non configurata. Aggiungi VITE_GEMINI_API_KEY su Vercel.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const imageParts = await Promise.all(images.map(file => fileToGenerativePart(file)));
      
      let finalPrompt = "";
      const isEmotional = style === 'emotional';

      // Logica Prompt (Mantenuta)
      if (mode === 'single') {
        finalPrompt = isEmotional ? EMOTIONAL_SYSTEM_PROMPT : CRITIC_SYSTEM_PROMPT;
        finalPrompt += "\n[Analizza questa singola immagine]";
      } else if (mode === 'project') {
        finalPrompt = isEmotional ? EMOTIONAL_SYSTEM_PROMPT : CRITIC_SYSTEM_PROMPT;
        finalPrompt += `\n[Analizza questo progetto di ${images.length} immagini]`;
      } else if (mode === 'curator') {
        finalPrompt = CURATOR_SYSTEM_PROMPT.replace(/{N}/g, selectionCount.toString());
      } else if (mode === 'editing') {
        finalPrompt = EDITING_SYSTEM_PROMPT;
      }

      const result = await model.generateContent([finalPrompt, ...imageParts as any]);
      const response = await result.response;
      setAnalysis(response.text());

    } catch (err: any) {
      console.error(err);
      setError(`Errore durante l'analisi: ${err.message || "Riprova."}`);
    } finally {
      setLoading(false);
    }
  };

  const MarkdownDisplay = ({ content }: { content: string }) => {
    return (
      <div className="space-y-4 text-gray-300 leading-relaxed whitespace-pre-wrap">
        {content.split('\n').map((line, i) => {
          if (line.startsWith('##')) return <h2 key={i} className="text-xl font-bold text-white mt-6 border-b border-gray-800 pb-2">{line.replace(/##/g, '')}</h2>;
          if (line.startsWith('*')) return <li key={i} className="ml-4 list-disc">{line.replace(/\*/g, '').trim()}</li>;
          return <p key={i}>{line}</p>;
        })}
      </div>
    );
  };

  const themeColor = style === 'emotional' ? 'rose' : mode === 'curator' ? 'amber' : mode === 'editing' ? 'emerald' : 'indigo';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Camera className={`w-6 h-6 ${style === 'emotional' ? 'text-rose-500' : 'text-indigo-500'}`} />
          <h1 className="text-lg font-bold tracking-tight">Visione <span className={style === 'emotional' ? 'text-rose-400' : 'text-indigo-400'}>AI</span></h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          {/* Selettore Modalità */}
          <div className="flex flex-wrap gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
            {(['single', 'project', 'curator', 'editing'] as const).map((m) => (
              <button 
                key={m} 
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Area Upload */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-gray-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 transition-all bg-gray-900/30 overflow-hidden relative"
          >
            {previewUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 w-full h-full">
                {previewUrls.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} className="w-full h-full object-cover" alt="preview" />
                ))}
              </div>
            ) : (
              <div className="text-center p-6">
                <Upload className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Clicca per caricare le immagini</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple={mode !== 'single' && mode !== 'editing'} hidden />
          </div>

          <button 
            onClick={analyzePhoto} 
            disabled={loading || images.length === 0}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all ${loading ? 'bg-gray-800' : 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/20'}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Inizia Analisi'}
          </button>

          {error && <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">{error}</div>}
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 min-h-[400px]">
          {analysis ? (
            <MarkdownDisplay content={analysis} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 italic">
              <Brain className="w-12 h-12 mb-4 opacity-20" />
              <p>I risultati dell'analisi appariranno qui...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
