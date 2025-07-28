# AIReadBriefForDyslexia 📚

Un'applicazione web per aiutare persone con dislessia a gestire e organizzare i loro libri. L'app permette di caricare libri, gestire una biblioteca personale e fornire supporto per la lettura.

## 🚀 Funzionalità

- **Gestione Biblioteca**: Aggiungi e organizza i tuoi libri
- **Upload File**: Carica file di libri nel formato preferito
- **Interfaccia Semplificata**: Design pulito e accessibile
- **Database Locale**: Salvataggio sicuro dei dati

## 🛠️ Tecnologie Utilizzate

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript vanilla
- **Database**: SQLite con better-sqlite3
- **File Upload**: Multer

## 📋 Prerequisiti

- Node.js (versione 14 o superiore)
- npm (Node Package Manager)

## 🔧 Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/tuousername/AIReadBriefForDyslexia.git
   cd AIReadBriefForDyslexia
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Avvia l'applicazione**
   ```bash
   npm start
   ```

4. **Apri nel browser**
   Naviga su `http://localhost:3000`

## 📁 Struttura del Progetto

```
AIReadBriefForDyslexia/
├── frontend/           # Frontend dell'applicazione
│   ├── components/     # Componenti HTML
│   ├── script/        # JavaScript del frontend
│   ├── index.html     # Pagina principale
│   └── style.css      # Stili CSS
├── db/                # Database e configurazione
├── assets/            # Risorse statiche (icone, immagini)
├── rawbookstorage/    # Directory per i file caricati
├── server.js          # Server Express
└── books.db           # Database SQLite
```

## 🎯 Come Usare

1. **Aggiungere un Libro**:
   - Clicca su "Aggiungi Libro"
   - Inserisci titolo e autore
   - Carica il file del libro (opzionale)
   - Conferma l'aggiunta

2. **Visualizzare i Libri**:
   - I libri aggiunti appariranno nella lista principale
   - Puoi visualizzare i dettagli di ogni libro

## 🤝 Contribuire

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 TODO

Vedi il file [TODO.md](./TODO.md) per la lista delle funzionalità da implementare.

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file [LICENSE](./LICENSE) per i dettagli.

## 👥 Autori

- **Il tuo nome** - *Sviluppo iniziale*

## 🙏 Ringraziamenti

- Comunità open source
- Tutti i contributori che hanno aiutato con questo progetto

---

⭐ Se questo progetto ti è stato utile, considera di dargli una stella su GitHub!