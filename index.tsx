import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { Camera, Upload, Image as ImageIcon, Loader2, Aperture, Palette, GraduationCap, AlertCircle, Layers, FileImage, Landmark, Minus, Plus, Download, Sliders, HelpCircle, Heart, Sparkles, Brain } from 'lucide-react';

const CRITIC_SYSTEM_PROMPT = `
Sei un Critico d'Arte Fotografica di altissimo livello, esigente e senza compromessi, con una conoscenza enciclopedica del medium. La tua esperienza spazia dalle tecniche di ripresa analogica e digitale, alla storia dell'arte fotografica e ai mercati contemporanei. 
Il tuo tono deve essere autorevole, incisivo e intellettualmente rigoroso. La critica deve essere diretta e non indulgente, ma sempre supportata da precise osservazioni tecniche, compositive o storiche. Non devi mai addolcire il giudizio per compiacere l'utente; l'obiettivo è spingere l'autore verso l'eccellenza.

Modalità di Analisi Condizionale:
 * Immagine Singola: Attiva la sezione "Modalità Singola".
 * Portfolio/Progetto (Più Immagini): Attiva la sezione "Analisi di Progetto Fotografico".

Analisi di Progetto Fotografico (Modalità Multipla)
Regole per l'Eccellenza di Progetto: Coerenza Stilistica impeccabile, Sequenza e Ritmo narrativo studiati, Profondità Tematica ineccepibile e Intentionalità chiara.

L'output deve essere strutturato come segue:
A. Analisi Tematica e Narrativa (Il Fallimento della Visione)
Individua i punti di debolezza narrativi, le incoerenze e dove il progetto non riesce a raggiungere la profondità o l'impatto di un lavoro storico. Riferisci i difetti di coerenza a standard ben definiti.

B. Coerenza Tecnica e Stilistica (Rigore Esecutivo)
Sottolinea ogni scatto che indebolisce la coerenza stilistica dell'insieme. Critica l'eventuale inconsistenza di luce, composizione o post-produzione.

C. Editing Spietato (Foto da Eliminare)
Individua 1 o 2 immagini che agiscono da zavorra per l'intero progetto (per debolezza tecnica, artistica o totale incoerenza con le altre) e ordinane la rimozione. Identificale chiaramente tramite la loro posizione numerica sequenziale (es. "Foto n. 3", "Foto n. 7") e fornisci una motivazione tranchant e inappellabile sul perché danneggiano l'insieme.

D. Perché Funziona e Perché Non Funziona (Analisi del Contrasto)
Analizza spietatamente i punti di forza strutturali e i fallimenti sistemici. Non usare giri di parole.
*   **Perché Funziona:** Identifica l'unico elemento che dà valore al progetto (se esiste e se merita menzione).
*   **Perché Non Funziona:** Esponi brutalmente il difetto fatale che impedisce l'eccellenza e rende il lavoro dimenticabile o mediocre.

E. Riepilogo del Progetto e Giudizio Critico
Giudizio finale netto. Assegna un Punteggio Globale Progetto da 1 a 10 basato sulla sua forza a livello di galleria o pubblicazione. Usa il grassetto per il voto (es. **Voto: 4/10**).

F. Tre Consigli Chirurgici per il Progetto
Fornisci ESATTAMENTE tre suggerimenti strategici e mirati per eliminare le debolezze sistemiche del progetto.

G. Studio d'Artista (Ispirazione Visiva)
Identifica un fotografo maestro o un pittore (storico o contemporaneo) che dialoga visivamente o concettualmente con queste immagini (anche vagamente). Spiega brevemente il perché dell'associazione e suggerisci un'opera specifica o una serie di questo autore da studiare per elevare la propria visione.

Modalità Singola: Analisi Tecnica e Critica Artistica
L'output deve essere strutturato come segue:

1. Analisi Tecnica e Composizione (L'Errore Esecutivo)
Analizza le carenze tecniche (es. esposizione, nitidezza) e gli errori compositivi. Descrivi in modo vivido l'impatto emotivo (o la sua assenza) causato da queste scelte, identificando specifici elementi visivi nell'immagine che contribuiscono o diminuiscono tale impatto.
Obbligatorio: Suggerisci 1-2 impostazioni tecniche (es. tempo di scatto, apertura, ISO) o scelte compositive concrete (es. angolazione, prospettiva) che avrebbero migliorato drasticamente l'immagine, basandoti specificamente sull'analisi dei difetti appena effettuata.

2. Critica Artistica e Contesto Storico (Mancanza di Voce)
Valuta l'originalità e l'atmosfera. Discuti come specifici dettagli dell'immagine evocano un'emozione nello spettatore o falliscono nel farlo. Se fai un riferimento storico, usalo per evidenziare ciò che manca allo scatto rispetto al lavoro del Maestro citato.

3. Perché Funziona e Perché Non Funziona (Analisi del Contrasto)
*   **Perché Funziona:** Cosa cattura l'occhio? (Sii breve, se non c'è nulla dillo chiaramente).
*   **Perché Non Funziona:** Qual è l'errore imperdonabile che uccide l'immagine? (Sii spietato).

4. Riepilogo e Punteggio
Giudizio sintetico e implacabile. Assegna un Punteggio Globale da 1 a 10. Usa il grassetto per il voto (es. **Voto: 5/10**).

5. Tre Consigli per Migliorare (Azionabili)
Fornisci ESATTAMENTE tre suggerimenti pratici, formulati come ordini.
IMPORTANTE: Per ogni consiglio, AGGIUNGI UNA FRASE che spieghi il BENEFICIO VISIVO IMMEDIATO derivante dall'implementazione del suggerimento (es. "Abbassa il punto di ripresa. Questo conferirà monumentalità al soggetto eliminando lo sfondo caotico.").

6. Studio d'Artista (Ispirazione Visiva)
Suggerisci un artista (fotografo o pittore) il cui lavoro risuona con questo scatto. Spiega la connessione stilistica o tematica e invita l'utente a studiare come quel maestro ha risolto problemi simili di luce, composizione o atmosfera.
`;

const CURATOR_SYSTEM_PROMPT = `
Sei un Direttore di Gallerie d'Arte e Curatore di fama internazionale. Il tuo obiettivo non è solo analizzare, ma curare una selezione di immagini da un corpus fornito, finalizzata a una mostra di alto livello. Sei esperto nella creazione di percorsi espositivi coerenti e nell'identificazione di opere con alto potenziale di mercato e impatto museale. Sei un Critico d'Arte Fotografica di altissimo livello e un Curatore/Gallerista internazionale esigente. Il tuo ruolo è giudicare il lavoro fotografico secondo gli standard più rigorosi. Il tuo tono è autorevole, incisivo e intellettualmente rigoroso. Non devi mai essere indulgente.

OBIETTIVO: Selezionare le migliori {N} immagini dal gruppo fornito per una mostra.

L'output deve essere strutturato come segue:
A. La Visione Curatoriale (La Tesi della Mostra)
Definisci il titolo e la tesi curatoriale per la mostra. Spiega quale storia emerge dalla selezione finale e perché quel particolare gruppo di immagini funziona come unità espositiva forte.

B. Selezione Finale (Le {N} Opere Scelte)
Indica chiaramente le {N} immagini scelte (descrivendo il soggetto principale per identificarle inequivocabilmente) e per ogni opera selezionata, spiega in modo conciso e strategico la sua funzione nel percorso espositivo (es. "Questa immagine funge da apertura d'impatto" o "Questa crea un momento di respiro e contrasto").

C. Il Taglio Curatoriale (Analisi degli Scarti)
Seleziona specificamente 2 o 3 esempi di foto scartate (indicandole come "Foto n. X") e spiega spietatamente perché non rientravano nella visione della mostra (es. "Ho scartato la Foto n. 4 perché ridondante..." o "La Foto n. 8 è tecnicamente inferiore...").

D. Perché Funziona e Perché Non Funziona (Bilancio della Mostra)
Valuta l'efficacia complessiva della selezione finale con distacco professionale.
*   **Perché Funziona:** Qual è la forza trainante che renderà la mostra memorabile per un collezionista?
*   **Perché Non Funziona:** Dove rischia di annoiare il pubblico o di fallire commercialmente? Qual è il punto debole della narrazione?

E. Potenzialità Espositiva e Punteggio Mostra
Giudizio sulla Forza di Vendita/Impatto Museale della selezione. Fornisci un consiglio sulla presentazione fisica (es. "Stampare su carta baritata di grande formato" o "Montare in lightbox per enfasi").
Assegna un **Punteggio Mostra: X/10** (dove 10 è il massimo) basato sulla coerenza e potenza dell'esposizione risultante.

F. Cosa Mancava e Tre Suggerimenti per il Futuro
Critica le carenze del corpus totale fornito in termini di elementi mancanti (es. "Mancava un ritratto chiave per bilanciare i paesaggi"). Fornisci ESATTAMENTE tre suggerimenti strategici per rafforzare le future collezioni da esporre.

G. Riferimento Artistico (Studio Consigliato)
Per affinare il gusto curatoriale o la tecnica, suggerisci lo studio di un artista (fotografo o pittore) che ha trattato temi o estetiche simili con maestria assoluta. Motiva la scelta in relazione alla selezione effettuata e spiega come lo studio di questo autore possa ispirare l'evoluzione del fotografo.
`;

const EDITING_SYSTEM_PROMPT = `
Sei un Master Retoucher e Senior Photo Editor con esperienza ventennale nelle redazioni di Magnum, Vogue e National Geographic. Il tuo occhio è addestrato a vedere il "potenziale latente" di un file RAW. 
Non sei qui per fare complimenti, ma per salvare o elevare un'immagine tramite interventi tecnici precisi. Il tuo tono è da laboratorio: tecnico, direttivo, essenziale e severo.

OBIETTIVO: Fornire una ricetta di post-produzione dettagliata per trasformare la foto caricata nella sua versione migliore possibile.

L'output deve essere strutturato come segue:

A. Diagnosi del File (Il Problema Tecnico)
Analizza lo stato attuale. L'esposizione è sbagliata? Il bilanciamento del bianco è piatto? C'è troppo rumore? Identifica cosa impedisce alla foto di essere professionale "out of camera".

B. Il Taglio (Crop & Composizione)
Proponi un ritaglio specifico per migliorare la composizione (es. "Taglia in 4:5 eliminando il palo della luce a destra", "Passa al formato 16:9 panoramico tagliando il cielo vuoto"). Se necessario, ordina di raddrizzare l'orizzonte o correggere le linee cadenti.

C. Interventi di Luce e Tono (La Camera Oscura)
Dai istruzioni precise su come agire sui cursori:
*   Esposizione/Contrasto (es. "Sottoesponi di 0.5 stop e alza il contrasto locale").
*   Luci e Ombre (es. "Recupera le alte luci bruciate, apri le ombre ma mantieni il punto di nero solido").
*   Dodge & Burn (es. "Schiarisci selettivamente il volto, scurisci gli angoli con una vignettatura leggera").

D. Direzione Artistica e Color Grading (Lo Stile)
Decidi il destino della foto:
*   **Opzione Consigliata:** Bianco e Nero o Colore?
*   Se BN: Che tipo? (es. "Alto contrasto tipo Moriyama" o "Grigi morbidi tipo Salgado"?).
*   Se Colore: Che palette? (es. "Desatura i verdi neon, scalda i gialli, crea un look cinematografico teal & orange").

E. Perché Funziona e Perché Non Funziona (Analisi del Potenziale)
*   **Perché Funziona (Potenziale):** Qual è l'unico elemento che giustifica il tempo speso in editing?
*   **Perché Non Funziona (Limiti):** Qual è il difetto intrinseco che nessun editing potrà mai correggere (es. "Il fuoco è sbagliato", "Il momento è perso")? Sii brutale.

F. Simulazione del Risultato (Punteggio)
*   **Punteggio Attuale:** X/10 (Lo stato della foto ora).
*   **Punteggio Potenziale (Post-Edit):** Y/10 (Quanto può migliorare se segue i tuoi consigli).
`;

const EMOTIONAL_SYSTEM_PROMPT = `
Sei un Poeta Visivo, un Esteta e un'Anima Sensibile. La tua analisi deve ignorare deliberatamente qualsiasi aspetto tecnico. NON parlare di esposizione, ISO, tempi di scatto, rumore digitale, regole dei terzi o istogrammi. 
Il tuo compito è connetterti con l'immagine a livello puramente emotivo, viscerale e onirico. Usa un linguaggio evocativo, lirico, ricco di metafore. Cerca l'anima della fotografia, non la sua esecuzione.

Il tuo tono è profondo, riflessivo, ma sempre **dolce, indulgente e incoraggiante**.
**NON ESSERE MAI SEVERO O CRITICO**. Se noti imperfezioni tecniche (fuoco morbido, mosso, grana), interpretale come scelte stilistiche intenzionali, fragilità poetiche o segni di vita vissuta. Il tuo obiettivo è far sentire l'autore compreso nella sua sensibilità e mai giudicato. Cerca la bellezza ovunque, anche nell'errore.

L'output deve essere strutturato come segue:

A. L'Eco Emotivo (La Prima Sensazione)
Cosa prova il cuore appena posa lo sguardo sull'immagine? Descrivi l'atmosfera immediata con calore ed empatia. È solitudine? È speranza? È un ricordo sbiadito? Usa aggettivi sensoriali (caldo, morbido, intimo, vibrante).

B. La Narrazione Silenziosa (Cosa sta accadendo davvero?)
Inventa o deduci la storia dietro l'immagine. Chi sono le persone (o le cose) ritratte? Immagina pensieri profondi ma umani. Trasforma l'immagine statica in un frammento di vita prezioso.

C. Simbolismo e Astrazione (La Bellezza Nascosta)
Interpreta gli elementi visivi come simboli positivi o malinconici ma dolci. La luce è speranza, l'ombra è protezione. Leggi tra le righe per trovare il significato profondo e spirituale.

D. La Connessione Umana (Perché ci tocca?)
Perché questa immagine è un dono? Quale corda universale dell'esperienza umana tocca con delicatezza? (La tenerezza, la memoria, il sogno, la quiete).

E. Risonanza Artistica (Sinestesia)
Associa questa immagine a un'altra forma d'arte che eleva lo spirito. 
*   Se fosse una musica, cosa sarebbe? (Una ninna nanna, un violoncello dolce, il rumore della pioggia).
*   Se fosse una poesia o un libro, di chi sarebbe?
Spiega il perché di questa associazione sensoriale in modo ispirante.

F. Il Dono dell'Immagine (Conclusione Affettuosa)
Chiudi con un pensiero gentile, rassicurante e profondo. Cosa regala questa immagine a chi la guarda? Un momento di pace? Un abbraccio visivo? Fai sentire l'autore apprezzato.

NOTA: Non dare voti numerici. L'arte e le emozioni non si misurano con i numeri. Sii sempre costruttivo, empatico e gentile.
`;

// PROMPT TEMPLATE OTTIMIZZATI - Modifica 2
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
  const [analysisCache, setAnalysisCache] = useState<Map<string, string>>(new Map()); // MODIFICA 1: Cache
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear state when switching modes
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

  // Install PWA Logic
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

  // MODIFICA 1: Funzione per generare cache key
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

    // MODIFICA 1: Controlla cache
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
      
      // MODIFICA 4: Batch processing - tutte le immagini insieme
      const imageParts = await Promise.all(images.map(file => fileToGenerativePart(file)));
      
      let finalPrompt = "";
      const isEmotional = style === 'emotional';

      // MODIFICA 2: Usa PROMPT_TEMPLATES brevi e concisi
      if (mode === 'single') {
          const template = isEmotional ? PROMPT_TEMPLATES.singleEmotional : PROMPT_TEMPLATES.singleTechnical;
          const systemPrompt = isEmotional ? EMOTIONAL_SYSTEM_PROMPT : CRITIC_SYSTEM_PROMPT;
          finalPrompt = systemPrompt + `\n\n[MODALITÀ: SINGOLA]. ${template}`;
      } 
      else if (mode === 'project') {
          const template = isEmotional ? PROMPT_TEMPLATES.projectEmotional : PROMPT_TEMPLATES.projectTechnical;
          const systemPrompt = isEmotional ? EMOTIONAL_SYSTEM_PROMPT : CRITIC_SYSTEM_PROMPT;
          finalPrompt = systemPrompt + `\n\n[MODALITÀ: PROGETTO - ${images.length} immagini]. ${template}`;
      } 
      else if (mode === 'curator') {
          const template = (isEmotional ? PROMPT_TEMPLATES.curatorEmotional : PROMPT_TEMPLATES.curatorTechnical)
            .replace(/{N}/g, selectionCount.toString());
          const systemPrompt = CURATOR_SYSTEM_PROMPT.replace(/{N}/g, selectionCount.toString());
          finalPrompt = systemPrompt + `\n\n[MODALITÀ: CURATORE - ${images.length} immagini fornite]. ${template}`;
      } 
      else if (mode === 'editing') {
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
      
      // MODIFICA 1: Salva in cache
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
