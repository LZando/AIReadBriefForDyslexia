const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('./db/init-db.js');

const app = express();
const PORT = 3000;

const bookstarageupload = multer({ dest: 'rawbookstorage/' });

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/api/add-book', bookstarageupload.single('file'), (req, res) => {
  const { title, author } = req.body;

  try {
    const filePath = req.file ? req.file.path : '';
    const id = db.addBook(title, author || '', filePath);
    res.json({ success: true, bookId: id });
  } catch (err) {
    console.error('Generic error.', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
