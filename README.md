# AI Read Brief for Dyslexia 📚🤖

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI Read Brief** is an intelligent reading assistant that automatically analyzes PDF documents, breaks them into chapters, and provides AI-powered summaries to enhance reading comprehension and accessibility.

## 🌟 What It Does

This application transforms complex reading materials into digestible, accessible content through:

- **📖 Automatic Chapter Detection**: Uses advanced font analysis to intelligently identify chapter boundaries in PDF documents
- **🧠 AI-Powered Summaries**: Leverages Google's Gemini AI to create detailed summaries or extract character information from selected chapters
- **🎯 Personalized Reading Experience**: Allows users to focus on specific sections and get targeted assistance
- **♿ Accessibility First**: Designed specifically to support people with reading difficulties

## 🎯 Who Benefits From This

### 📚 **Rediscover Forgotten Books**
- Quickly refresh your memory on books you started but never finished
- Get chapter-by-chapter summaries to decide which sections to revisit
- Bridge the gap between where you left off and where you want to continue

### 🔍 **Clarify Complex Content**
- Break down confusing chapters into clear, understandable summaries
- Get different perspectives on difficult concepts
- Transform academic jargon into accessible language

### 🧩 **Master Long-Form Content**
- Consolidate key concepts from lengthy essays and complex texts
- Create a roadmap of main ideas before diving into detailed reading
- Build understanding progressively through structured summaries

### 🧠 **Support for Learning Differences**
**Especially beneficial for individuals with:**
- **Dyslexia**: Reduces cognitive load by providing clear summaries alongside original text
- **ADHD**: Helps maintain focus by breaking content into manageable chunks
- **Processing Difficulties**: Offers multiple ways to access the same information
- **Reading Fatigue**: Provides condensed versions when energy is limited

## ✨ Key Features

- 🔍 **Smart Chapter Detection**: Automatically identifies chapter boundaries using font analysis
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🗂️ **Personal Library**: Organize and manage your processed books with delete functionality
- ⚡ **Intelligent Caching**: Fast access to previously processed content
- 🎨 **Dyslexia-Friendly UI**: Clean, accessible interface designed for readability
- 🔄 **Real-time Processing**: Watch your document being processed in real-time
- 💾 **Persistent Storage**: Your library and summaries are saved for future access
- 🎭 **Dual Analysis Modes**: Choose between summarization or character extraction
- 🗑️ **Library Management**: Delete books from your library when no longer needed

## 🛠️ Installation

### Prerequisites

- Python 3.9 or higher
- A Google Gemini API key (for AI summaries)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd AIReadBriefForDyslexia
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the project root:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Install additional AI dependencies:**
   ```bash
   pip install google-genai
   ```

## 🚀 Usage

1. **Start the application:**
   ```bash
   python app.py
   ```

2. **Open your browser:**
   Navigate to `http://localhost:5000`

3. **Upload a PDF:**
   - Click the library icon to access your personal library
   - Upload a PDF document
   - Wait for automatic chapter detection

4. **Generate summaries or character analysis:**
   - Browse detected chapters
   - Select chapters you want to analyze
   - Choose between "Summarization" or "Characters" mode
   - Get AI-powered analysis in seconds

5. **Manage your library:**
   - Delete books you no longer need using the trash icon
   - Organize your collection efficiently

## 📁 Project Structure

```
AIReadBriefForDyslexia/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── .env                       # Environment variables
├── frontend/                  # Web interface
│   ├── index.html            # Main application interface
│   ├── styles/               # CSS styling
│   └── js/                   # JavaScript controllers
├── logic/                     # Core processing logic
│   ├── chapterlistcreator.py # Chapter detection algorithm
│   ├── gemini_generation.py  # AI summary generation
│   ├── pdf_splitter.py       # PDF processing utilities
│   └── extractor.py          # Text and image extraction
├── bookstore/                 # Document storage
│   ├── booktemp/             # Temporary processing
│   └── elaboratebook/        # Processed books cache
└── assets/                    # Static assets and logos
```

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Application health check |
| `/api/library` | GET/POST | Manage personal library |
| `/api/library/<book_id>` | DELETE | Delete book from library |
| `/api/bookelaboration` | POST | Process uploaded books |
| `/api/gemini-generation` | POST | Generate summaries or character analysis |
| `/api/book-image/<book>/<page>` | GET | Retrieve page images |
| `/api/cleanup` | POST | Clean temporary files |

## 🧠 How It Works

### 1. **Document Analysis**
- Uploads are processed using PyMuPDF for text and image extraction
- Font analysis identifies the most common large fonts (typically chapter headings)
- Pages are scanned to find text matching the chapter heading pattern

### 2. **Chapter Detection**
- The algorithm analyzes font sizes and styles throughout the document
- Identifies consistent patterns that indicate chapter boundaries
- Creates a structured chapter index with page numbers and titles

### 3. **AI Analysis**
- Selected chapters are sent to Google's Gemini AI
- Choose between two analysis modes:
  - **Summarization**: Detailed, contextual summaries of content
  - **Characters**: Extract and analyze character information from text
- Custom prompts ensure analysis is relevant and detailed
- Results are cached for quick future access

### 4. **Accessibility Features**
- Clean, high-contrast interface
- Large, readable fonts
- Logical navigation flow
- Mobile-responsive design

## 💡 Use Cases

### 📖 Academic Research
- Quickly review lengthy academic papers
- Extract key findings from research documents
- Compare concepts across multiple sources
- Analyze character development in literary studies

### 📚 Personal Reading
- Catch up on book club selections
- Review classic literature with modern context
- Explore non-fiction topics efficiently
- Track character relationships in complex narratives

### 🏫 Educational Support
- Assist students with learning disabilities
- Provide reading support in multiple languages
- Create study guides from textbooks
- Analyze character development for literature classes

### 💼 Professional Development
- Extract insights from business books
- Review industry reports efficiently
- Analyze policy documents and white papers
- Character analysis for storytelling and communication training

## 🔒 Privacy & Security

- **Local Processing**: All document processing happens on your device
- **Secure API Usage**: Only chapter text is sent to AI services for analysis
- **No Data Collection**: Your reading habits and documents remain private
- **Temporary Storage**: Uploaded files can be cleaned up automatically

## 🤝 Contributing

We welcome contributions! Please see our contribution guidelines for:
- Bug reports and feature requests
- Code contributions and improvements
- Documentation updates
- Accessibility enhancements

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Accessibility Community**: For insights into inclusive design
- **Dyslexia Research**: For understanding reading challenges and solutions
- **Open Source Libraries**: PyMuPDF, Flask, and the broader Python ecosystem
- **Google Gemini**: For providing advanced AI capabilities

## 📞 Support

If you encounter issues or have questions:
- Open an issue on GitHub
- Check the documentation
- Contact the development team

---

**Made with ❤️ for accessible reading and learning**