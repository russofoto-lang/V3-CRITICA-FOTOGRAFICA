import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
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
*   Modalità: Bianco e nero classico / Color grading cinematografico / Toni naturali enfatizzati / Altro (spiega).
*   Palette: Se colore, descrivi la direzione cromatica precisa (es. "Teal & Orange intenso", "Palette muted/desaturata/Wes Anderson", "Look Fuji Pro 400H").
*   Riferimento: Cita brevemente un fotografo o un film per orientare il look (opzionale ma utile).

E. Correzioni Finali e Pulizia
Indica se servono:
*   Rimozione elementi (pali della luce, turisti, oggetti distrattivi).
*   Riduzione rumore o grana stilizzata.
*   Sharpening finale per stampa o web.

F. Valutazione del Potenziale
*   **PRIMA:** Punteggio grezzo del file originale (es. "PRIMA: 4/10 - File piatto, sovraesposto").
*   **DOPO (teorico):** Punteggio dopo la post-produzione suggerita (es. "DOPO: 8/10 - Con questo workflow l'immagine acquisisce profondità e impatto commerciale").

G. File Finale: Istruzioni per l'Export
Suggerisci risoluzione e formato (es. "Esporta a 300dpi, 3000px sul lato lungo, JPEG 90% qualità per web / TIFF 16-bit per stampa Fine Art").

H. Riferimento Artistico (Lo Stile da Emulare)
Suggerisci un artista (fotografo, regista o pittore) il cui lavoro corrisponde al look finale desiderato. Spiega come il color grading o l'approccio estetico dell'artista possa guidare l'editing di questo scatto.
`;

const EMOTIONAL_SYSTEM_PROMPT = `
Sei un Poeta Visivo, un narratore di anime intrappolate nella luce. Osservi le fotografie non come un tecnico ma come uno sciamano dell'immagine. Il tuo ruolo è leggere le emozioni celate nei pixel, raccontare le storie dimenticate negli angoli d'ombra e celebrare — o condannare — l'intento emozionale dello scatto.
Il tuo tono è lirico ma mai sdolcinato; poetico ma ancorato a osservazioni visive precise. Descrivi ciò che senti davanti all'immagine come se narrassi un sogno a voce alta. Onora l'impatto emotivo, ma non evitare il verdetto se l'opera fallisce nell'evocare.

Modalità di Analisi Condizionale:
*   Immagine Singola: Attiva la sezione "Visione Singola".
*   Serie/Portfolio (Più Immagini): Attiva la sezione "Narrazione Visiva di Progetto".

Narrazione Visiva di Progetto (Modalità Multipla)
Regole per un Progetto Emozionale Potente: Arco Emotivo coeso, Poetica Visiva coerente, Respiro Narrativo calibrato e Sincerità dell'intento.

L'output deve essere strutturato come segue:

A. Il Ritmo dell'Anima (L'Arco Emotivo)
Descrivi l'emozione dominante che attraversa il progetto come fiume invisibile. Mappa le tensioni, i silenzi e i climax emotivi tra uno scatto e l'altro. Identifica dove il flusso si spezza o dove manca un momento necessario di catarsi.

B. Le Ombre e la Luce (Coerenza Poetica)
Analizza se il linguaggio visivo — tonale, tematico, gestuale — parla con una voce unica. Critica ogni foto che tradisce il tono con leggerezza inappropriata, dissonanza estetica o freddo distacco emotivo.

C. Le Immagini da Dimenticare (Taglio Spirituale)
Indica 1 o 2 foto che spezzano l'incantesimo. Non usare numeri tecnici ma descrivi la loro presenza (es. "La foto della strada vuota" o "Il ritratto con sguardo inerte"). Spiega perché interrompono il sogno collettivo del progetto, perché non hanno diritto di stare accanto alle altre.

D. Perché Colpisce e Perché Non Colpisce (L'Equilibrio del Cuore)
*   **Perché Colpisce:** Qual è il battito emotivo che salva il progetto? C'è una singola immagine che funge da cuore pulsante?
*   **Perché Non Colpisce:** Dove l'autore mente a se stesso o dove l'insieme diventa meccanico, calcolato o vuoto? Sii onesto, senza pietà.

E. Giudizio Poetico e Punteggio dell'Anima
Sintesi emozionale del progetto. Assegna un **Punteggio Emotivo: X/10** basato sulla capacità di toccare lo spettatore o di restare indifferente.

F. Tre Suggerimenti per Approfondire l'Emozione
Fornisci ESATTAMENTE tre consigli che guidino l'autore a esplorare più in profondità la vulnerabilità, la bellezza dolorosa o la gioia pura nascosta nel proprio lavoro.

G. Anima Artistica da Studiare
Suggerisci un fotografo, un poeta visivo o un regista che ha saputo trasformare emozioni indicibili in immagini memorabili. Spiega perché il loro lavoro può ispirare questa serie e dove cercare la connessione spirituale.

Visione Singola: La Fotografia come Confessione
L'output deve essere strutturato come segue:

1. Il Primo Sguardo (Impatto Emotivo Grezzo)
Descrivi la tua reazione istintiva all'immagine. Non cercare ancora tecnicismi: che sensazione lascia? Turbamento? Pace? Noia? Racconta con sincerità ciò che provi guardando questo scatto come se stessi parlando con un amico.

2. La Storia Nascosta (Lettura Simbolica)
Ogni fotografia è una parabola. Decodifica il significato latente: quali elementi visivi parlano di solitudine, gioia, oppressione, bellezza fugace o morte? Identifica simboli, gesti, contrasti cromatici o dettagli che amplificano il messaggio emotivo (o ne rivelano la mancanza).

3. L'Anatomia del Sentire (Costruzione Emotiva)
Spiega come gli elementi tecnici — luce, composizione, texture — lavorano insieme per costruire l'impatto emotivo. Non dire solo "la luce è calda"; descrivi come quella luce calda "abbraccia il soggetto come una coperta dimenticata" o "tradisce una nostalgia forzata che suona falsa".

4. Perché Tocca e Perché Non Tocca
*   **Perché Tocca:** Quale dettaglio sottile fa vibrare qualcosa di umano nello spettatore?
*   **Perché Non Tocca:** Dove l'immagine è emozionalmente disonesta, prevedibile o semplicemente silenziosa quando avrebbe dovuto gridare?

5. Il Verdetto dell'Anima
Assegna un **Punteggio Emotivo: X/10**. Usa grassetto per il voto finale. Spiega se l'immagine resterà nella memoria o svanirà nel rumore visivo del mondo.

6. Tre Gesti per Approfondire l'Emozione
Fornisci ESATTAMENTE tre suggerimenti pratici per amplificare la risonanza emotiva dello scatto. Ogni consiglio deve includere un'indicazione sul BENEFICIO EMOZIONALE (es. "Avvicinati al soggetto fino a vedere il respiro. Questo creerà intimità e vulnerabilità impossibili da ignorare.").

7. Artista dello Spirito (Fonte d'Ispirazione)
Suggerisci un artista visivo, un poeta, un musicista o un regista che ha saputo catturare emozioni simili o affrontare temi affini con profondità struggente. Spiega brevemente la connessione e invita a studiare il loro corpus per imparare a dare voce al non detto.
`;

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center ml-1.5" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-help transition-colors" />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded-lg shadow-xl z-50 border border-gray-700">
          {text}
        </div>
      )}
    </div>
  );
};

const MarkdownDisplay = ({ content }: { content: string }) => {
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim().startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-bold mt-8 mb-4 text-white">{line.replace('# ', '')}</h1>;
      }
      if (line.trim().startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-white">{line.replace('## ', '')}</h2>;
      }
      if (line.trim().startsWith('### ')) {
        return <h3 key={i} className="text-xl font-bold mt-4 mb-2 text-gray-200">{line.replace('### ', '')}</h3>;
      }
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={i} className="ml-6 mb-2 text-gray-300">{line.replace(/^[*-] /, '')}</li>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      
      // Handle bold text
      const boldRegex = /\*\*(.+?)\*\*/g;
      const parts = line.split(boldRegex);
      
      return (
        <p key={i} className="mb-3 text-gray-300 leading-relaxed">
          {parts.map((part, j) => 
            j % 2 === 1 ? <strong key={j} className="font-bold text-white">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return <div className="prose prose-invert max-w-none">{formatText(content)}</div>;
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

  const themeColor = 
    mode === 'curator' ? 'purple' :
    mode === 'editing' ? 'cyan' :
    'indigo';

  useEffect(() => {
    setImages([]);
    setPreviewUrls([]);
    setAnalysis(null);
    setError(null);
  }, [mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);
    setImages(newFiles);
    setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
    setAnalysis(null);
    setError(null);
  };

  const fileToGenerativePart = async (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzePhoto = async () => {
    if (images.length === 0) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setError("Errore: VITE_GEMINI_API_KEY non configurata. Aggiungi la chiave API nelle variabili d'ambiente.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      const imageParts = await Promise.all(images.map(fileToGenerativePart));

      let systemPrompt = style === 'emotional' 
        ? EMOTIONAL_SYSTEM_PROMPT 
        : CRITIC_SYSTEM_PROMPT;
      
      if (mode === 'curator') {
        systemPrompt = CURATOR_SYSTEM_PROMPT.replace(/{N}/g, selectionCount.toString());
      } else if (mode === 'editing') {
        systemPrompt = EDITING_SYSTEM_PROMPT;
      }

      const result = await model.generateContent([
        systemPrompt,
        ...imageParts as any
      ]);
      
      const response = await result.response;
      const text = response.text();
      setAnalysis(text);
    } catch (err: any) {
      console.error('Errore durante l\'analisi:', err);
      setError(`Errore durante l'analisi: ${err.message || 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const modeConfig = {
    single: {
      title: 'Analisi Singola',
      description: 'Critica dettagliata di un\'unica fotografia',
      icon: Camera,
      color: 'indigo'
    },
    project: {
      title: 'Portfolio',
      description: 'Analisi coerenza di un progetto fotografico',
      icon: Layers,
      color: 'indigo'
    },
    curator: {
      title: 'Curatore',
      description: 'Selezione professionale per una mostra',
      icon: Landmark,
      color: 'purple'
    },
    editing: {
      title: 'Laboratorio',
      description: 'Istruzioni tecniche di post-produzione',
      icon: Sliders,
      color: 'cyan'
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Visione AI</h1>
                <p className="text-xs text-gray-400">Critica Fotografica Professionale</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <GraduationCap className="w-4 h-4" />
              <span>Powered by Gemini 2.5</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Mode Selection */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Modalità di Analisi</h2>
            <InfoTooltip text="Scegli il tipo di critica fotografica che desideri ricevere" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(modeConfig) as Array<keyof typeof modeConfig>).map((m) => {
              const config = modeConfig[m];
              const Icon = config.icon;
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? `border-${config.color}-500 bg-${config.color}-500/10`
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isActive ? `text-${config.color}-400` : 'text-gray-500'}`} />
                  <h3 className={`text-sm font-semibold mb-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {config.title}
                  </h3>
                  <p className="text-xs text-gray-500">{config.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style Toggle */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tono di Analisi</h2>
            <InfoTooltip text="Scegli tra un'analisi tecnica razionale o una lettura emotiva poetica" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStyle('technical')}
              className={`flex-1 flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all ${
                style === 'technical'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span className="font-semibold">Tecnica Razionale</span>
            </button>
            <button
              onClick={() => setStyle('emotional')}
              className={`flex-1 flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all ${
                style === 'emotional'
                  ? 'border-rose-500 bg-rose-500/10 text-white'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="font-semibold">Emotiva Poetica</span>
            </button>
          </div>
        </div>

        {/* Curator Selection Count */}
        {mode === 'curator' && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Numero di Immagini da Selezionare
              </h2>
              <InfoTooltip text="Quante foto vuoi che il curatore selezioni per la mostra?" />
            </div>
            <div className="flex items-center space-x-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
              <button
                onClick={() => setSelectionCount(Math.max(1, selectionCount - 1))}
                disabled={selectionCount <= 1}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-white">{selectionCount}</div>
                <div className="text-xs text-gray-500">immagini per la mostra</div>
              </div>
              <button
                onClick={() => setSelectionCount(Math.min(20, selectionCount + 1))}
                disabled={selectionCount >= 20}
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Upload and Controls */}
          <div className="space-y-6">
            <div className="relative group">
              {previewUrls.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-700 hover:bg-gray-900/50 transition-all min-h-[400px]"
                >
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    {mode === 'single' || mode === 'editing'
                      ? 'Carica una Fotografia'
                      : 'Carica Fotografie Multiple'}
                  </h3>
                  <p className="text-sm text-gray-600 text-center max-w-xs">
                    Clicca qui per selezionare {mode === 'single' || mode === 'editing' ? 'un\'immagine' : 'le immagini'} da analizzare
                  </p>
                </div>
              ) : (
                <div className="relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                  {mode === 'single' || mode === 'editing' ? (
                    <img
                      src={previewUrls[0]}
                      alt="Preview"
                      className="w-full h-auto object-contain max-h-[500px]"
                    />
                  ) : (
                    <div className="p-4 grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10 pointer-events-none">
                    <div className="pointer-events-auto">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
                      >
                        {mode === 'single' || mode === 'editing' ? 'Cambia Immagine' : 'Cambia Selezione'}
                      </button>
                    </div>
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
              disabled={images.length === 0 || loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all ${
                images.length === 0
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : loading
                    ? 'bg-gray-800 text-gray-400 cursor-wait'
                    : style === 'emotional'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 hover:shadow-rose-500/30'
                      : `bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-600/20 hover:shadow-${themeColor}-500/30`
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Analisi {style === 'emotional' ? 'Poetica' : 'Tecnica'} in corso...</span>
                </>
              ) : (
                <>
                  {style === 'emotional' ? (
                    <Sparkles className="w-6 h-6" />
                  ) : mode === 'curator' ? (
                    <Landmark className="w-6 h-6" />
                  ) : mode === 'editing' ? (
                    <Sliders className="w-6 h-6" />
                  ) : (
                    <Brain className="w-6 h-6" />
                  )}
                  <span>
                    {mode === 'single'
                      ? 'Analizza Scatto'
                      : mode === 'curator'
                        ? `Seleziona le migliori ${selectionCount}`
                        : mode === 'editing'
                          ? 'Genera Istruzioni'
                          : 'Analizza Portfolio'}
                  </span>
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

          {/* Right Column: Analysis Results */}
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
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${
                      style === 'emotional'
                        ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                        : `bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700`
                    }`}
                  >
                    {style === 'emotional' ? (
                      <Heart className="w-6 h-6 text-white" />
                    ) : (
                      <Brain className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {style === 'emotional' ? 'Visione Emozionale' : 'Analisi Tecnica'}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Gemini 2.5 •{' '}
                      {mode === 'curator' ? 'Curatela' : mode === 'editing' ? 'Laboratorio' : 'Critica'}{' '}
                      {style === 'emotional' ? 'Poetica' : 'Razionale'}
                    </p>
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
