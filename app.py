import os
import ssl
import time
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

# Create Flask app
app = Flask(__name__)

# Bypass SSL verification if needed (common in some local python environments)
if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

RSS_FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache
cache = {
    "data": None,
    "last_fetched": 0,
    "expiry": 300  # 5 minutes cache expiry
}

def clean_text(html_content):
    """Convert HTML content to clean plain text for tweets."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    # Replace links with text (href) if needed, or just get text
    for a in soup.find_all('a'):
        # Just keep text, we will add the main link to the tweet separately
        a.replace_with(a.get_text())
    
    # Get clean text
    text = soup.get_text(separator=" ")
    # Collapse multiple spaces
    text = " ".join(text.split())
    return text

def fetch_and_parse_release_notes():
    """Fetch the BigQuery release notes RSS feed and parse it into individual updates."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(RSS_FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        # Parse XML content
        feed = feedparser.parse(response.content)
        
        all_updates = []
        
        for entry in feed.entries:
            date_str = entry.get('title', 'Unknown Date')
            updated_iso = entry.get('updated', '')
            base_link = entry.get('link', 'https://cloud.google.com/bigquery/docs/release-notes')
            entry_id = entry.get('id', '')
            
            summary_html = entry.get('summary', '')
            if not summary_html and entry.get('content'):
                summary_html = entry.get('content')[0].value
                
            if not summary_html:
                continue
                
            soup = BeautifulSoup(summary_html, 'html.parser')
            
            # BigQuery release notes group updates by day.
            # Within a day, updates are under <h3> headings (e.g., <h3>Feature</h3>, <h3>Changed</h3>).
            current_type = "Update"
            current_elements = []
            item_index = 0
            
            # Helper to commit current elements as a single update
            def save_update(u_type, elements, idx):
                if not elements:
                    return
                # Build HTML string for elements
                html_str = "".join(str(el) for el in elements)
                txt_str = clean_text(html_str)
                
                # Create a unique ID
                unique_id = f"{entry_id}_{idx}"
                
                all_updates.append({
                    "id": unique_id,
                    "date": date_str,
                    "timestamp": updated_iso,
                    "type": u_type,
                    "content_html": html_str,
                    "content_text": txt_str,
                    "link": base_link
                })
            
            for child in soup.children:
                # Skip empty text nodes
                if isinstance(child, str) and not child.strip():
                    continue
                    
                if child.name == 'h3':
                    # Save the previous block before starting a new one
                    save_update(current_type, current_elements, item_index)
                    item_index += 1
                    current_elements = []
                    current_type = child.get_text(strip=True)
                else:
                    if child.name or isinstance(child, str):
                        current_elements.append(child)
                        
            # Save the final block of the entry
            save_update(current_type, current_elements, item_index)
            
        return all_updates
        
    except Exception as e:
        print(f"Error fetching or parsing release notes: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    if force_refresh or not cache["data"] or (current_time - cache["last_fetched"] > cache["expiry"]):
        print("Fetching fresh data from feed...")
        parsed_data = fetch_and_parse_release_notes()
        if parsed_data is not None:
            cache["data"] = parsed_data
            cache["last_fetched"] = current_time
        elif not cache["data"]:
            # If fetch failed and we have no cached data, return error
            return jsonify({"error": "Failed to fetch release notes and no cache available."}), 500
            
    return jsonify({
        "last_updated": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache["last_fetched"])),
        "updates": cache["data"]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    # Run server
    app.run(host='0.0.0.0', port=port, debug=True)
