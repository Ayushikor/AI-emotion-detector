# EmotionSense – AI Emotion Detection Learning Assistant

EmotionSense is a browser-based AI assistant designed to enhance the learning experience by monitoring user emotional states in real-time. It uses behavioral tracking (mouse movements, clicks, scrolling) and machine learning to predict if a student is confused, frustrated, bored, or engaged.

## 🚀 Main Features
- **Behavior Tracking**: Monitors mouse speed, scroll patterns, typing, and idle time.
- **AI Prediction**: Flask-based backend using Random Forest for emotion classification.
- **Real-time Dashboard**: Modern React UI with Recharts for engagement analysis.
- **Smart Suggestions**: Context-aware prompts like "Take a break" or "Watch a video explanation".
- **Chrome Extension**: Lightweight Manifest V3 extension for background tracking.

## 📂 Project Structure
- `/extension`: Manifest V3 extension source code.
- `/backend`: Python Flask API and Scikit-learn model.
- `/src`: React source for the Dashboard.
- `/documentation`: Project report and viva prep.

## 🛠️ Setup Instructions

### 1. Backend Setup (Python)
1. Navigate to `/backend`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```
   The backend will start on `http://localhost:5000`.

### 2. Chrome Extension Loading
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `/extension` folder from this project.
5. Pin the extension to your toolbar.

### 3. Dashboard Preview
In this development environment, the dashboard runs automatically. 
To run locally:
```bash
npm install
npm run dev
```

## 🧠 AI Model Training
The project includes a `sample_dataset.csv`. The `emotion_model.py` automatically trains a Random Forest model on first run. You can enhance the dataset by adding more behavioral rows to the CSV.

## 🔒 Privacy & Security
- **Local Processing**: Behavioral data is processed locally as much as possible.
- **Consent**: Users are notified when tracking starts.
- **Anonymized Data**: No direct identification linked to raw behavioral metrics.

---
*Created for a Minor Project in AI/ML & Web Development.*
