import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { Camera, Upload, Image as ImageIcon, Loader2, Aperture, Palette, GraduationCap, AlertCircle, Layers, FileImage, Landmark, Minus, Plus, Download, Sliders, HelpCircle, Heart, Sparkles, Brain } from 'lucide-react';

const CRITIC_SYSTEM_PROMPT = `Sei un Critico d'Arte Fotografica di altissimo livello, esigente e senza compromessi. Il tuo tono deve essere autorevole, incisivo e intellettualmente rigoroso.`;

const CURATOR_SYSTEM_PROMPT = `Sei un Direttore di Gallerie d'Arte e Curatore di fama internazionale. OBIETTIVO: Selezionare le migliori {N} immagini dal gruppo fornito per una mostra.`;

const EDITING_SYSTEM_PROMPT = `Sei un Master Retoucher e Senior Photo Editor con esperienza ventennale. Fornisci una ricetta di post-produzione dettagliata.`;

const EMOTIONAL_SYSTEM_PROMPT = `Sei un Poeta Visivo, un Esteta e un'Anima Sensibile. Connettiti con l'immagine a livello puramente emotivo, viscerale e onirico. Il tuo tono è sempre dolce, indulgente e incoraggiante. NON ESSERE MAI SEVERO.`;

const PROMPT_TEMPLATES = {
  singleTechnical: "Analisi tecnica spietata: composizione, esposizione, focus. Sii severo.",
  singleEmotional: "Qual è l'emozione principale? Descrivi la poesia visiva.",
  projectTechnical: "Analizza il portfolio: coerenza stilistica, sequenza narrativa, tecnica impeccabile.",
  projectEmotional: "Valuta il flusso emotivo tra le immagini. Come evolve l'emozione dalla prima all'ultima?",
  curatorTechnical: "Seleziona le {N} migliori. Criteri: impatto museale, perfezione tecnica, valore di mercato.",
  curatorEmotional: "Seleziona le {N} con maggiore FORZA EVOCATIVA. Scegli quelle che fanno sognare, piangere.",
  editingTechnical: "Ricetta di post-produzione: esposizione, contrasto, recupero ombre, colore neutro.",
  editingEmotional: "Suggerisci color grading audaci: mood cinematici, nostalgici, onirici. Trasforma in quadro."
};

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div 
      className="relative inline-flex items-center ml-1.5"
      onClick={(e) => {
        e.stopPropagation();
        setShow(!show);
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors cursor-help opacity-70 hover:opacity-100" />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg shadow-xl z-50 text-center leading-relaxed animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
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
  const [analysisCache, setAnalysisCache] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages([]);
    setPreviewUrls((prev) => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
    setAnalysis(null);
    setError(null);
    setSelectionCount(mode === 'curator' ? 3 : 1);
  }, [mode]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const getCacheKey = (files: File[]) => {
    return files.map(f => `${f.name}-${f.size}-${f.lastModified}`).join('|');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      
      if ((mode === 'single' || mode === 'editing') && newFiles.length > 1) {
        setError("In questa modalità puoi caricare solo una foto.");
        return;
      }
      
      if (mode === 'curator' && newFiles.length < selectionCount) {
        setError(`Per la modalità Curatore devi caricare almeno ${selectionCount} foto.`);
      } else {
        setError(null);
      }

      setImages(newFiles);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newUrls);
      setAnalysis(null);
    }
  };

  const incrementSelection = () => setSelectionCount(p => Math.min(p + 1, 20));
  const decrementSelection = () => setSelectionCount(p => Math.max(p - 1, 1));

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise as string,
        mimeType: file.type,
      },
    };
  };

  const analyzePhoto = async () => {
    if (images.length === 0) return;

    if (mode === 'curator' && images.length < selectionCount) {
      setError(`Devi caricare almeno ${selectionCount} immagini per effettuare una selezione.`);
      return;
    }

    const cacheKey = getCacheKey(images);
    if (analysisCache.has(cacheKey)) {
      setAnalysis(analysisCache.get(cacheKey) || null);
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const model = 'gemini-robotics-er-1.5-preview';
      
      const imageParts = await Promise.all(images.map(file => fileToGenerativePart(file)));
      
      let finalPrompt = "";
      const isEmotional = style === 'emotional';

      if (mode === 'single') {
        const template = isEmotional ? PROMPT_TEMPLATES.singleEmotional : PROMPT_TEMPLATES.singleTechnical;
        const systemPrompt = isEmotional ? EMOTIONAL_SYSTEM_PROMPT : CRITIC_SYSTEM_PROMPT;
        finalPrompt = systemPrompt + `\n\n[MODALITÀ: SINGOLA]. ${template}`;
      } else if (mode === 'project') {
        const template = isEmotional ? PROMPT_TEMPLATES.projectEmotional : PROMPT_TEMPLATES.projectTechnical;
        const systemPrompt = isEmotional ? EMOTIONAL_SYSTEM_PROMPT : CRITIC_SYSTEM_PROMPT;
        finalPrompt = systemPrompt + `\n\n[MODALITÀ: PROGETTO - ${images.length} immagini]. ${template}`;
      } else if (mode === 'curator') {
        const template = (isEmotional ? PROMPT_TEMPLATES.curatorEmotional : PROMPT_TEMPLATES.curatorTechnical)
          .replace(/{N}/g, selectionCount.toString());
        const systemPrompt = CURATOR_SYSTEM_PROMPT.replace(/{N}/g, selectionCount.toString());
        finalPrompt = systemPrompt + `\n\n[MODALITÀ: CURATORE - ${images.length} immagini fornite]. ${template}`;
      } else if (mode === 'editing') {
        const template = isEmotional ? PROMPT_TEMPLATES.editingEmotional : PROMPT_TEMPLATES.editingTechnical;
        const systemPrompt = EDITING_SYSTEM_PROMPT;
        finalPrompt = systemPrompt + `\n\n[MODALITÀ: EDITING]. ${template}`;
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            ...imageParts,
            { text: finalPrompt }
          ]
        }
      });

      const resultText = response.text || "Nessuna analisi generata.";
      setAnalysisCache(new Map(analysisCache).set(cacheKey, resultText));
      setAnalysis(resultText);
    } catch (err: any) {
      console.error("Error analyzing photo:", err);
      setError("Si è verificato un errore durante l'analisi. Riprova più tardi o controlla la tua connessione.");
    } finally {
      setLoading(false);
    }
  };

  const MarkdownDisplay = ({ content }: { content: string }) => {
    const sections = content.split(/\n/);
    return (
      <div className="markdown-body space-y-4">
        {sections.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold text-indigo-400 mt-6 mb-2">{trimmed.substring(4)}</h3>;
          if (trimmed.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold text-white mt-8 mb-4 border-b border-gray-700 pb-2">{trimmed.substring(3)}</h2>;
          if (trimmed.startsWith('**') && trimmed.endsWith('**')) return <p key={idx} className="font-bold text-lg text-gray-200 mt-4">{trimmed.replace(/\*\*/g, '')}</p>;
          
          const boldKeyRegex = /(\*\*.*?\*\*)/g;
          const parts = line.split(boldKeyRegex);
          
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-gray-300">
                {parts.map((part, pIdx) => 
                  part.startsWith('**') && part.endsWith('**') 
                    ? <strong key={pIdx} className="text-white font-semibold">{part.replace(/\*\*/g, '')}</strong> 
                    : part
                )}
              </li>
            );
          }
          if (trimmed === '') return <br key={idx} />;
          return (
            <p key={idx} className="text-gray-300">
              {parts.map((part, pIdx) => 
                part.startsWith('**') && part.endsWith('**') 
                  ? <strong key={pIdx} className="text-indigo-200">{part.replace(/\*\*/g, '')}</strong> 
                  : part
              )}
            </p>
          );
        })}
      </div>
    );
  };

  const getStyleColor = () => {
    if (style === 'emotional') return 'rose';
    if (mode === 'curator') return 'amber';
    if (mode === 'editing') return 'emerald';
    return 'indigo';
  };

  const themeColor = getStyleColor();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg shadow-lg transition-colors duration-500 ${style === 'emotional' ? 'bg-rose-600 shadow-rose-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}>
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Visione <span className={`transition-colors duration-500 ${style === 'emotional' ? 'text-rose-400' : 'text-indigo-400'}`}>AI</span></h1>
          </div>
          <div className="flex items-center space-x-3">
            {installPrompt && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 transition-colors animate-in fade-in"
              >
                <Download className="w-3 h-3" />
                <span>Installa App</span>
              </button>
            )}
            <div className="hidden sm:block text-xs font-medium px-3 py-1 bg-gray-800 rounded-full text-gray-400 border border-gray-700">
              {style === 'emotional' ? 'Lettura Poetica & Emozionale' : 'Analisi Tecnica & Critica'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 pb-24">
        <div className="flex flex-col items-center justify-center mb-10 space-y-8">
          <div className="bg-gray-900 p-1.5 rounded-2xl flex flex-wrap justify-center gap-1 border border-gray-800 shadow-lg">
            <button onClick={() => setMode('single')} className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${mode === 'single' ? `bg-${themeColor}-600 text-white shadow-md` : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <FileImage className="w-4 h-4" />
              <span className="hidden sm:inline">Foto Singola</span>
              <span className="sm:hidden">Singola</span>
            </button>
            <button onClick={() => setMode('project')} className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${mode === 'project' ? `bg-${themeColor}-600 text-white shadow-md` : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Progetto</span>
              <span className="sm:hidden">Progetto</span>
            </button>
            <button onClick={() => setMode('curator')} className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${mode === 'curator' ? `bg-${themeColor}-600 text-white shadow-md` : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Landmark className="w-4 h-4" />
              <span className="hidden sm:inline">Curatore</span>
              <span className="sm:hidden">Curatore</span>
            </button>
            <button onClick={() => setMode('editing')} className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${mode === 'editing' ? `bg-${themeColor}-600 text-white shadow-md` : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Editing Lab</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center bg-gray-900 rounded-full p-1 border border-gray-800 shadow-md">
              <button onClick={() => setStyle('technical')} className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${style === 'technical' ? 'bg-gray-800 text-white shadow-sm ring-1 ring-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>
                <Brain className="w-4 h-4" />
                <span>Tecnica</span>
              </button>
              <button onClick={() => setStyle('emotional')} className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${style === 'emotional' ? 'bg-rose-900/80 text-rose-100 shadow-sm ring-1 ring-rose-700' : 'text-gray-500 hover:text-rose-400'}`}>
                <Heart className={`w-4 h-4 ${style === 'emotional' ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>Emozionale</span>
              </button>
            </div>

            {mode === 'curator' && (
              <div className="flex items-center space-x-3 bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Opere da selezionare</span>
                <div className="flex items-center space-x-2 border-l border-gray-700 pl-3">
                  <button onClick={decrementSelection} className="p-1 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-lg font-bold text-white w-5 text-center">{selectionCount}</span>
                  <button onClick={incrementSelection} className="p-1 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-1 shadow-2xl shadow-black/50 overflow-hidden">
              {previewUrls.length === 0 ? (
                <div onClick={() => fileInputRef.current?.click()} className={`h-96 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group px-6 text-center ${style === 'emotional' ? 'border-gray-700 hover:border-rose-500 hover:bg-rose-900/10' : 'border-gray-700 hover:border-indigo-500 hover:bg-gray-800/50'}`}>
                  <div className={`bg-gray-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform ${style === 'emotional' ? 'text-rose-400' : 'text-gray-300'}`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium text-gray-300">{mode === 'single' ? "Carica una fotografia" : mode === 'editing' ? "Carica foto per editing" : mode === 'curator' ? "Carica il corpus di immagini" : "Carica le foto del progetto"}</p>
                  <p className="text-xs text-gray-600 mt-6 font-medium uppercase tracking-wide">{mode === 'single' || mode === 'editing' ? "JPG, PNG fino a 10MB" : mode === 'curator' ? `Seleziona più di ${selectionCount} immagini` : "Seleziona più immagini"}</p>
                </div>
              ) : (
                <div className="relative group bg-black rounded-xl overflow-hidden min-h-[384px] flex items-center justify-center">
                  {mode === 'single' || mode === 'editing' ? (
                    <img src={previewUrls[0]} alt="Preview" className="w-full h-auto max-h-[600px] object-contain" />
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-2 w-full h-full max-h-[600px] overflow-y-auto custom-scrollbar">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative group/img">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-800" />
                          <div className="absolute top-1 left-1 bg-black/80 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-gray-600 shadow-md">{idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10 pointer-events-none">
                    <div className="pointer-events-auto">
                      <button onClick={() => fileInputRef.current?.click()} className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg">
                        {mode === 'single' || mode === 'editing' ? "Cambia Immagine" : "Cambia Selezione"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple={mode !== 'single' && mode !== 'editing'} className="hidden" />
            </div>

            <button onClick={analyzePhoto} disabled={images.length === 0 || loading} className={`w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all ${images.length === 0 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : loading ? 'bg-gray-800 text-gray-400 cursor-wait' : style === 'emotional' ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 hover:shadow-rose-500/30' : `bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-600/20 hover:shadow-${themeColor}-500/30`}`}>
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Analisi {style === 'emotional' ? 'Poetica' : 'Tecnica'} in corso...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>{mode === 'single' ? 'Analizza Scatto' : mode === 'curator' ? `Seleziona le migliori ${selectionCount}` : mode === 'editing' ? 'Genera Istruzioni' : 'Analizza Portfolio'}</span>
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {loading && !analysis && (
              <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-800 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                </div>
                <div className="h-32 bg-gray-800 rounded-xl w-full"></div>
              </div>
            )}

            {analysis && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-gray-800">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${style === 'emotional' ? 'bg-gradient-to-br from-rose-500 to-pink-600' : `bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700`}`}>
                    {style === 'emotional' ? <Heart className="w-6 h-6 text-white" /> : <Brain className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{style === 'emotional' ? "Visione Emozionale" : "Analisi Tecnica"}</h2>
                    <p className="text-sm text-gray-400">Gemini Robotics • {mode === 'curator' ? 'Curatela' : mode === 'editing' ? 'Laboratorio' : 'Critica'} {style === 'emotional' ? 'Poetica' : 'Razionale'}</p>
                  </div>
                </div>
                
                <MarkdownDisplay content={analysis} />

                <div className="mt-10 pt-6 border-t border-gray-800 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Suggerimenti adattivi inclusi</span>
                  </div>
                  <span>Generato da Google Gemini</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
