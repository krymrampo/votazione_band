# 🎸 Votazione Repertorio Band (Mobile-First)

## Workspace della band

La home collega `/votazione`, `/scaletta`, `/note` e `/download-mp3`.
Scaletta e note usano Supabase quando configurato; senza credenziali restano nel
browser, con indicazione esplicita. Gli errori cloud non attivano salvataggi locali.
La scaletta e unica e condivisa; le revisioni impediscono di sovrascrivere una
modifica effettuata da un'altra sessione. Le note possono essere generali o
collegate a un brano. Eliminare il brano conserva il testo della nota.

### Database

Sul progetto Supabase esistente eseguire **`supabase_workspace.sql`** nell'SQL
Editor. La migrazione e rieseguibile e non elimina brani o voti. Per un nuovo
database, eseguire prima `supabase_schema.sql`. Le nuove tabelle mantengono il
modello di accesso condiviso senza account gia usato dalla band.

### Runtime e deploy Vercel

- Node.js **22.x**, installazione `npm ci`, build `npm run build`.
- Next.js 15.5.26, React 18; PostCSS aggiornato tramite override delle dipendenze.
- Attivare **Fluid Compute** nelle impostazioni Vercel. La route MP3 richiede
  `maxDuration = 300`; download e conversione hanno un timeout interno di 240 s.
- Configurare `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` anche
  nell'ambiente Preview per verificare le pagine condivise.
- Non servono worker esterni, bucket, token YouTube o nuove chiavi per gli MP3.
- `prebuild` scarica i binari della piattaforma e verifica SHA-256 fissati nel
  repository. Sono disponibili Linux x64 e macOS arm64/x64; servono accesso a
  GitHub Releases in build e permessi di esecuzione sul server.
- I binari ignorati da Git sono in `.media-bin/<piattaforma>`; il tracing Next
  include soltanto quelli della piattaforma di build nella route MP3. I tre
  binari Linux occupano circa 200 MB non compressi: controllare anche il bundle
  totale nella build Vercel rispetto al limite del piano.

Il convertitore usa yt-dlp **2026.08.19** e FFmpeg/FFprobe **b6.1.1**. Lo script
`scripts/prepare-media.mjs` documenta versioni, URL ufficiali di distribuzione e
checksum; aggiornarli insieme quando necessario. Le distribuzioni FFmpeg sono
quelle di [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static), con le
rispettive licenze e sorgenti descritte dal progetto.

### Contratto MP3

`POST /api/download-mp3` riceve JSON `{ "url": "https://youtu.be/VIDEO_ID" }`.
In caso di successo risponde con `audio/mpeg`, `Content-Disposition` e streaming;
gli errori precedenti allo streaming sono JSON `{ error, code, requestId }`.
I log `[mp3]` e l'header `X-Request-Id` permettono di individuare la richiesta.

Sono supportati singoli video pubblici/non in elenco, massimo 10 minuti e 50 MiB
di sorgente, convertiti a 192 kbps. Playlist, dirette e contenuti autenticati
vengono respinti. I temporanei sono univoci e rimossi al completamento, errore o
annullamento gestito. Un arresto forzato della piattaforma puo saltare la pulizia;
`/tmp` non viene usata come storage persistente. Una conversione per istanza
limita CPU e spazio: non e un limite globale fra istanze Vercel.

Il client conserva il risultato solo in memoria fino a cambio pagina o nuova
conversione. Non esiste un secondo endpoint che presupponga la presenza dello
stesso file su un'altra istanza. Errori durante il trasferimento interrompono
lo stream e vengono mostrati come download fallito.

### Verifiche

```bash
npm ci
npm run media:prepare
npm test
npm run build
npm run dev -- --port 3100
# In un secondo terminale, con Google Chrome installato:
npm run test:browser
```

I test browser usano dati locali isolati e richiedono un server senza variabili
Supabase configurate. `TEST_BASE_URL` cambia l'indirizzo; non usare questa suite
contro il database della band. Il test SQL usa Postgres in memoria (PGlite), non
il progetto Supabase reale. Il test codec genera audio sintetico oltre 4,5 MiB.

Dopo il deploy verificare separatamente: download reale YouTube, risposta oltre
4,5 MB, annullamento e dati condivisi in due browser. Un test locale non certifica
il download su Vercel: YouTube puo rifiutare richieste provenienti dal server.
L'app espone questi errori senza passare automaticamente a un servizio esterno.

---

Web app moderna, veloce e ottimizzata per smartphone, pensata per il gruppo musicale (**Chiara, Elisa, Matteo, Frarampo, Frabergo, Fracocò, GianTheManager**) per proporre e votare i brani da inserire nel repertorio.

---

## 📱 Funzionalità Principali

* **Nessun login o registrazione:** all'ingresso si seleziona il proprio nome (*Chiara, Elisa, Matteo, Frarampo, Frabergo, Fracocò, GianTheManager*), che rimane memorizzato sul telefono. È possibile cambiarlo con 1 tap nell'header.
* **Votazione ultra-rapida:** valutazione da **1 a 4 stelle** con tap immediato e feedback istantaneo ("*scorro e voto con un tap*").
* **Le 3 Tab:**
  1. 📋 **Tutti i brani:** lista completa con ricerca istantanea (titolo/artista) e ordinamenti.
  2. ⚡ **Da Votare:** mostra solo i brani in cui non hai ancora espresso il tuo voto.
  3. 🏆 **Top Scaletta:** classifica automatica ordinata per consenso (media stelle + numero di voti).
* **Trasparenza sui voti:** tap su qualsiasi brano per vedere chi ha votato cosa (es. *Chiara: ★★★★, Matteo: ★★★☆*).
* **Anonimato delle proposte:** chi inserisce un nuovo brano rimane **100% anonimo**.
* **Aggiunta rapida:** titolo brano obbligatorio, artista facoltativo e auto-voto immediato.

---

## 🚀 Avvio Locale (Test Immediato)

1. Installa le dipendenze:
   ```bash
   npm install
   ```

2. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

3. Apri il browser su [http://localhost:3000](http://localhost:3000).
   *Nota: L'app include brani demo e funziona subito anche senza configurare il database grazie al fallback locale.*

---

## 🌐 Pubblicazione su GitHub & Vercel (Online per la Band)

### Passo 1: Carica su GitHub
```bash
git init
git add .
git commit -m "Initial commit: App Votazione Band"
git branch -M main
# Crea una nuova repository vuota su https://github.com/new e lancialo:
git remote add origin https://github.com/TUO-USERNAME/NOME-REPO.git
git push -u origin main
```

### Passo 2: Configura Supabase (Database Cloud Gratuito)
1. Vai su [supabase.com](https://supabase.com) e crea un progetto gratuito (richiede 1 minuto).
2. Nel menu a sinistra vai su **SQL Editor**, incolla il contenuto del file [`supabase_schema.sql`](./supabase_schema.sql) ed esegui con **Run**.
3. Vai su **Project Settings -> API** e copia:
   - **Project URL**
   - **anon / public key**

### Passo 3: Collega e Pubblica su Vercel
1. Vai su [vercel.com](https://vercel.com) e accedi con GitHub.
2. Clicca **"Add New... -> Project"** e seleziona il tuo repository GitHub.
3. Nella sezione **Environment Variables**, aggiungi le due variabili copiate da Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL` = (il tuo URL Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (la tua chiave anon)
4. Clicca **Deploy**! 🚀

Ora condividi il link Vercel nella chat del gruppo e iniziate a votare i brani!
