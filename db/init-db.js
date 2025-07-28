const Database = require('better-sqlite3');

const DB_PATH = 'books.db';
const dbExists = require('fs').existsSync(DB_PATH);
const db = new Database(DB_PATH);

if (!dbExists) {
  console.log('Database not found. Creating...');

  db.exec(`
    CREATE TABLE books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      filename TEXT,
      original_name TEXT,
      filepath TEXT,
      file_size INTEGER,
      mime_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      chapter_number INTEGER,
      title TEXT,
      content TEXT NOT NULL,
      summary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(book_id) REFERENCES books(id)
    );
  `);

  console.log('Database created and initialized successfully.');
} else {
  console.log('Database already exists.');

  // Check if the new columns exist, add them if they don't
  try {
    db.prepare('SELECT filename FROM books LIMIT 1').get();
  } catch (error) {
    console.log('Adding new columns to existing database...');
    db.exec(`
      ALTER TABLE books ADD COLUMN filename TEXT;
      ALTER TABLE books ADD COLUMN original_name TEXT;
      ALTER TABLE books ADD COLUMN filepath TEXT;
      ALTER TABLE books ADD COLUMN file_size INTEGER;
      ALTER TABLE books ADD COLUMN mime_type TEXT;
    `);
    console.log('Database schema updated successfully.');
  }
}

function addBook(bookData) {
  if (typeof bookData === 'string') {
    // Legacy support: if only title is passed as string
    const stmt = db.prepare('INSERT INTO books (title, author) VALUES (?, ?)');
    const result = stmt.run(bookData, 'Anonimous');
    return result.lastInsertRowid;
  }

  // New format: expecting an object with book data
  const {
    title,
    author = 'Anonimous',
    filename = null,
    originalName = null,
    filepath = null,
    fileSize = null,
    mimeType = null
  } = bookData;

  const stmt = db.prepare(`
    INSERT INTO books (title, author, filename, original_name, filepath, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(title, author, filename, originalName, filepath, fileSize, mimeType);
  return result.lastInsertRowid;
}

function getAllBooks() {
  const stmt = db.prepare('SELECT * FROM books ORDER BY created_at DESC');
  return stmt.all();
}

function getBookById(id) {
  const stmt = db.prepare('SELECT * FROM books WHERE id = ?');
  return stmt.get(id);
}

function deleteBook(id) {
  const stmt = db.prepare('DELETE FROM books WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

function addChapter(bookId, chapterNumber, title, content, summary = null) {
  const stmt = db.prepare(`
    INSERT INTO chapters (book_id, chapter_number, title, content, summary)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(bookId, chapterNumber, title, content, summary);
  return result.lastInsertRowid;
}

function getChaptersByBookId(bookId) {
  const stmt = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number');
  return stmt.all(bookId);
}

module.exports = {
  addBook,
  getAllBooks,
  getBookById,
  deleteBook,
  addChapter,
  getChaptersByBookId,
  db
};