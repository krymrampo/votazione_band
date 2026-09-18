# 🎸 Votazione Repertorio Band (Mobile-First)

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
