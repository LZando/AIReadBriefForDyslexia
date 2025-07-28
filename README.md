# AIReadBriefForDyslexia 📚

An intelligent reading assistant designed to help dyslexic readers and anyone who struggles to maintain context while reading. The application provides chapter summaries and character descriptions to enhance reading comprehension and retention.

## 🚀 Features

- **Chapter Summaries**: AI-powered brief summaries of previous chapters to help readers stay on track
- **Character Profiles**: Quick character descriptions and relationship maps
- **Reading Progress Tracking**: Monitor your reading journey with visual progress indicators
- **Accessible Interface**: Designed with dyslexia-friendly fonts and color schemes

## 🛠️ Technologies

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Database**: SQLite with better-sqlite3
- **AI Integration**: Google Gemini API for intelligent text analysis
- **File Upload**: Multer for document processing

## 📋 Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Google Gemini API key (for AI features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tuousername/AIReadBriefForDyslexia.git
   cd AIReadBriefForDyslexia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file in the root directory
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
AIReadBriefForDyslexia/
├── frontend/           # Frontend application
│   ├── components/     # HTML components
│   ├── script/        # Frontend JavaScript
│   ├── index.html     # Main page
│   └── style.css      # CSS styles
├── db/                # Database configuration
├── assets/            # Static resources (icons, images)
├── rawbookstorage/    # Uploaded files directory
├── server.js          # Express server
└── books.db           # SQLite database
```

## 🎯 How to Use

1. **Add a Book**:
   - Click "Add Book"
   - Enter title and author
   - Upload book file (optional)
   - Confirm addition

2. **Reading with AI Support**:
   - Select a book from your library
   - View chapter summaries as you progress
   - Access character descriptions when needed
   - Track your reading progress

## 🧠 AI-Powered Features

- **Smart Summarization**: Automatically generates concise chapter summaries
- **Character Analysis**: Extracts and maintains character information
- **Context Preservation**: Helps maintain story continuity across reading sessions

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 TODO

See [TODO.md](./TODO.md) for the complete list of features to implement.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## 👥 Authors

- **Zando** - *Initial development*

## 🙏 Acknowledgments

- Open source community
- All contributors who have helped with this project
- Dyslexia research community for insights and feedback

## 🎯 Mission

Our mission is to make reading more accessible and enjoyable for everyone, especially those with dyslexia. By providing intelligent reading assistance, we aim to reduce reading barriers and enhance comprehension.

---

⭐ If this project has been helpful to you, consider giving it a star on GitHub!