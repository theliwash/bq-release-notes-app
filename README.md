# BigQuery Release Radar 📡

A beautiful, high-performance developer dashboard to fetch, filter, inspect, and share Google BigQuery release notes in real-time. Built with a Python Flask backend and a modern glassmorphic vanilla HTML/CSS/JS frontend.

![BigQuery Release Radar](https://www.gstatic.com/images/branding/product/1x/bigquery_64dp.png)

## ✨ Features

- **Granular Update Parsing**: Automatically processes the official Google Cloud BigQuery RSS feed (`docs.cloud.google.com/feeds/bigquery-release-notes.xml`) and parses daily entries into individual, item-level release cards (e.g., separating distinct Features, Announcements, and Issues).
- **Dynamic Stats Dashboard**: Real-time summary counts showing the number of total updates, new features, announcements, and issues/fixes in the current feed.
- **Client-Side Live Search**: Instant keyword search filtering through update text, dates, or tags.
- **Categorized Filters**: Clean navigation tabs to filter updates by type: *Features, Announcements, Changes, Issues, Fixes, or Deprecations*.
- **Interactive Tweet (X) Composer**: Click the Twitter/X logo on any update card to open a custom simulated Tweet composing card. It pre-fills the tweet content and link, manages Twitter's 23-character link length calculations, and links directly to the X Web Intent publisher.
- **Quick Links & Clipboard Tools**: Direct link sharing with success notification toasts and direct links to the official Google Cloud documentation section.
- **Intelligent Caching**: In-memory backend caching (5-minute expiry) to speed up loading and prevent rate-limiting, paired with a manual force-refresh spinner button.

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, Feedparser (RSS parsing), BeautifulSoup4 (HTML parser)
- **Frontend**: Plain HTML5, Vanilla CSS3 (Custom properties, CSS grid, Glassmorphism, CSS Animations), Vanilla JavaScript (ES6+, Fetch API)

## 🚀 Getting Started

### Prerequisites

Make sure you have Python 3 installed on your system.

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/theliwash/bq-release-notes-app.git
   cd bq-release-notes-app
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Create venv
   python3 -m venv venv

   # Activate venv (macOS/Linux)
   source venv/bin/activate

   # Activate venv (Windows)
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python3 app.py
   ```

5. **Open your browser**:
   Go to [http://127.0.0.1:5001](http://127.0.0.1:5001) to view the application dashboard.

## 📂 Project Structure

```
├── app.py                 # Flask server, RSS parser & caching endpoint
├── requirements.txt       # Python project dependencies
├── .gitignore             # Git exclusion file
├── static/
│   ├── css/
│   │   └── style.css      # Rich glassmorphic CSS styling rules
│   └── js/
│       └── app.js         # Frontend interactive logic (search, filter, Tweet modals)
└── templates/
    └── index.html         # Main dashboard template
```

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
