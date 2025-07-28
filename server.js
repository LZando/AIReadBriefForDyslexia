const express = require('express');
const path = require('path');
const db = require('./db/init-db.js');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});


app.post('/api/add-book', (req, res) => {
  const { title, author } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Il titolo è obbligatorio.' });
  }

  try {
    const id = addBook(title, author);
    res.json({ success: true, bookId: id });
  } catch (err) {
    console.error('Errore durante l\'aggiunta del libro:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
});