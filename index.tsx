import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, AlertCircle, Layers, FileImage, Landmark, Minus, Plus, Sliders, Heart, Sparkles, Brain } from 'lucide-react';

const CRITIC_SYSTEM_PROMPT = `Sei un Critico d'Arte Fotografica di altissimo livello, esigente e senza compromessi. Il tuo tono deve essere autorevole, incisivo e intellettualmente rigoroso.

MODALITÀ SINGOLA:
1. Analisi Tecnica e Composizione - Analizza carenze, suggerisci 1-2 impostazioni concrete
2. Critica Artistica - Valuta originalità e atmosfera
3. Perché Funziona e Perché Non Funziona
4. **Punteggio Globale: X/10**
5. Tre Consigli Pratici con benefici visivi
6. Studio d'Artista

MODALITÀ PROGETTO (Più immagini):
A. Analisi Tematica e Narrativa
B. Coerenza Tecnica e Stilistica
C. Foto da Eliminare (indicale come "Foto n. X")
D. Perché Funziona e Perché Non Funziona
E. **Punteggio Globale: X/10**
F. Tre Consigli Chirurgici
G. Studio d'Artista`;

const CURATOR_SYSTEM_PROMPT = `Sei un Curatore di fama internazionale. Seleziona le migliori {N} immagini dal gruppo fornito per una mostra di alto livello.

A. La Visione Curatoriale - Titolo e tesi della mostra
B. Selezione Finale (Le {N} Opere) - Descrivi il soggetto di ogni foto selezionata
C. Il Taglio Curatoriale - Indica 2-3 foto scartate come "Foto n. X" spiegando perché
D. Perché Funziona e Perché Non Funziona
E. **Punteggio Mostra: X/10** e raccomandazioni di stampa
F. Cosa Mancava e Tre Suggerimenti
G. Riferimento Artistico`;

const EDITING_SYSTEM_PROMPT = `Sei un Master Retoucher con esperienza ventennale. Fornisci una ricetta di post-produzione dettagliata.

A. Diagnosi del File - Identifica i problemi tecnici
B. Il Taglio (Crop & Composizione)
C. Interventi di Luce e Tono - Istruzioni precise sui cursori
D. Direzione Artistica e Color Grading
E. Perché Funziona e Perché Non Funziona
F. Tre Consigli Chiave di Post-Produzione
G. Riferimento Stilistico
H. **Punteggio Attuale: X/10** e **Punteggio Potenziale: Y/10**`;

const EMOTIONAL_SYSTEM_PROMPT = `Sei un Poeta Visivo e un'Anima Sensibile. Ignora completamente ogni aspetto tecnico. Connettiti emotivamente, usa linguaggio lirico. Sii dolce, indulgente, mai severo.

MODALITÀ SINGOLA:
1. L'Eco Emotivo - La prima sensazione
2. La Narrazione Silenziosa - La storia dietro l'immagine
3. Simbolismo e Astrazione
4. Perché Funziona e Perché Non Funziona (dolcemente)
5. Tre Consigli per l'Anima (no tecnica)
6. Risonanza Artistica
7. Il Dono dell'Immagine - Conclusione affettuosa

NON dare voti numerici. Sii costruttivo e gentile.

MODALITÀ PROGETTO:
Analizza il "flusso emotivo" tra le immagini. Non dare voti, scrivi commento critico-poetico sulla sequenza.

MODALITÀ CURATORE (EMOZIONALE):
Seleziona per FORZA EVOCATIVA e POETICA, non per mercato o tecnica. Titolo onirico e astratto.

MODALITÀ EDITING (CREATIVO):
Non correggere neutralità, crea ATMOSFERA. Suggerisci color grading audaci (Cinematico, Nostalgico, Onirico, Dark). Trasforma in quadro.`;

const App = () => {
  const [mode, setMode] = useState('single');
  const [style, setStyle] = useState('technical');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectionCount, setSelectionCount] = useState(3);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImages([]);
    setPreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
    setAnalysis('');
    setError('');
    setSelectionCount(mode === 'curator' ? 3 : 1);
  }, [mode]);

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      if ((mode === 'single' || mode === 'editing') && newFiles.length > 1) {
        setError("In questa modalità puoi caricare solo una foto.");
        return;
      }
      
      if (mode === 'curator' && newFiles.length < selectionCount) {
        setError(`Per il Curatore devi caricare almeno ${selectionCount} foto.`);
      } else {
        setError('');
      }

      setImages(newFiles);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newUrls);
      setAnalysis('');
    }
  };

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve({
          inlineData: { data: base64, mimeType: file.type }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzePhoto = async () => {
    if (!images.length || !apiKey.trim()) return;

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const imageParts = await Promise.all(images.map(fileToGenerativePart));
      
      let finalPrompt = "";
      const isEmotional = style === 'emotional';

      if (mode === 'single') {
        finalPrompt = isEmotional 
          ? EMOTIONAL_SYSTEM_PROMPT + "\n\n[SINGOLA-EMOZIONALE]"
          : CRITIC_SYSTEM_PROMPT + "\n\n[SINGOLA-TECNICA]";
      } else if (mode === 'project') {
        finalPrompt = isEmotional 
          ? EMOTIONAL_SYSTEM_PROMPT + `\n\n[PROGETTO-EMOZIONALE con ${images.length} immagini]. Analizza flusso emotivo.`
          : CRITIC_SYSTEM_PROMPT + `\n\n[PROGETTO-TECNICO con ${images.length} immagini]. Analizza coerenza.`;
      } else if (mode === 'curator') {
        finalPrompt = CURATOR_SYSTEM_PROMPT.replace(/{N}/g, selectionCount);
        if (isEmotional) {
          finalPrompt += `\n\n[CURATORE-EMOZIONALE]. Seleziona per FORZA EVOCATIVA.`;
        } else {
          finalPrompt += `\n\n[CURATORE-MUSEALE]. Seleziona per mercato e impatto.`;
        }
      } else if (mode === 'editing') {
        finalPrompt = EDITING_SYSTEM_PROMPT;
        if (isEmotional) {
          finalPrompt += `\n\n[EDITING-CREATIVO]. Crea atmosfera, color grading audaci.`;
        } else {
          finalPrompt += `\n\n[EDITING-TECNICO]. Correggi errori, massimizza qualità.`;
        }
      }

      const url = new URL('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent');
      url.searchParams.append('key', apiKey);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: {
            parts: [...imageParts, { text: finalPrompt }]
          },
          generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Errore ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessuna analisi');
    } catch (err) {
      setError(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const MarkdownDisplay = ({ content }) => {
    return (
      <div className="space-y-4 text-gray-300">
        {content.split('\n').map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold text-indigo-400 mt-4">{trimmed.substring(4)}</h3>;
          if (trimmed.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold text-white mt-6 mb-3 border-b border-gray-700 pb-2">{trimmed.substring(3)}</h2>;
          if (trimmed === '') return <br key={idx} />;
          
          const parts = line.split(/(\*\*.*?\*\*)/g);
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return <li key={idx} className="ml-4 list-disc">{parts.map((p, i) => p.startsWith('**') ? <strong key={i} className="text-indigo-200">{p.replace(/\*\*/g, '')}</strong> : p)}</li>;
          }
          return <p key={idx} className="leading-relaxed">{parts.map((p, i) => p.startsWith('**') ? <strong key={i} className="text-indigo-200">{p.replace(/\*\*/g, '')}</strong> : p)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg shadow-lg ${style === 'emotional' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Visione <span className={style === 'emotional' ? 'text-rose-400' : 'text-indigo-400'}>AI</span></h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center justify-center mb-10 space-y-6">
          <div className="bg-gray-900 p-1.5 rounded-2xl flex flex-wrap justify-center gap-1 border border-gray-800">
            {[
              { id: 'single', label: 'Foto Singola', icon: FileImage },
              { id: 'project', label: 'Progetto', icon: Layers },
              { id: 'curator', label: 'Curatore', icon: Landmark },
              { id: 'editing', label: 'Editing Lab', icon: Sliders }
            ].map(btn => {
              const Icon = btn.icon;
              return (
                <button 
                  key={btn.id}
                  onClick={() => setMode(btn.id)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
                    mode === btn.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center bg-gray-900 rounded-full p-1 border border-gray-800">
              <button
                onClick={() => setStyle('technical')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-2 ${
                  style === 'technical' ? 'bg-gray-800 text-white' : 'text-gray-500'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>Tecnica</span>
              </button>
              <button
                onClick={() => setStyle('emotional')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-2 ${
                  style === 'emotional' ? 'bg-rose-900 text-rose-100' : 'text-gray-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${style === 'emotional' ? 'fill-rose-400' : ''}`} />
                <span>Emozionale</span>
              </button>
            </div>

            {mode === 'curator' && (
              <div className="flex items-center space-x-2 bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
                <button onClick={() => setSelectionCount(Math.max(1, selectionCount - 1))} className="p-1 hover:bg-gray-700 rounded"><Minus className="w-3 h-3" /></button>
                <span className="text-lg font-bold w-5 text-center">{selectionCount}</span>
                <button onClick={() => setSelectionCount(Math.min(20, selectionCount + 1))} className="p-1 hover:bg-gray-700 rounded"><Plus className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <button
                onClick={() => setShowApiInput(!showApiInput)}
                className="w-full text-left text-sm font-semibold text-gray-300 hover:text-white py-2 px-2"
              >
                {showApiInput ? '▼' : '▶'} API Key
              </button>
              {showApiInput && (
                <input
                  type="password"
                  placeholder="Google Gemini API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full mt-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              )}
              <p className="text-xs text-gray-500 mt-2">Da <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">ai.google.dev</a></p>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-1 shadow-2xl">
              {previewUrls.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-96 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-indigo-500"
                >
                  <div className="p-4 rounded-full mb-4 bg-indigo-900/20 text-indigo-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium text-gray-300">Carica fotografia</p>
                  <p className="text-xs text-gray-600 mt-4">JPG, PNG fino a 10MB</p>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group bg-black rounded-xl overflow-hidden min-h-96 flex items-center justify-center cursor-pointer"
                >
                  {(mode === 'single' || mode === 'editing') ? (
                    <img src={previewUrls[0]} alt="Preview" className="w-full h-auto max-h-96 object-contain" />
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-2 w-full max-h-96 overflow-y-auto">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative">
                          <img src={url} alt={`${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-800" />
                          <div className="absolute top-1 left-1 bg-black/80 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">{idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold">Cambia</button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                multiple={mode !== 'single' && mode !== 'editing'}
                className="hidden" 
              />
            </div>

            <button
              onClick={analyzePhoto}
              disabled={!images.length || loading || !apiKey.trim()}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all ${
                !images.length || !apiKey.trim() || loading
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Analisi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>
                    {mode === 'single' ? 'Analizza' : mode === 'curator' ? `Seleziona ${selectionCount}` : mode === 'editing' ? 'Editing' : 'Analizza Portfolio'}
                  </span>
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {loading && !analysis && (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-800 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                </div>
              </div>
            )}

            {analysis && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-800">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${
                    style === 'emotional' ? 'bg-rose-600' : 'bg-indigo-600'
                  }`}>
                    {style === 'emotional' ? <Heart className="w-6 h-6 text-white" /> : <Brain className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {style === 'emotional' ? "Visione Poetica" : "Analisi Critica"}
                    </h2>
                    <p className="text-xs text-gray-400">Gemini 2.0 Flash</p>
                  </div>
                </div>
                
                <MarkdownDisplay content={analysis} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
