from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime
from emotion_model import emotion_engine

app = Flask(__name__)
CORS(app)

DB_PATH = 'emotionsense.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            emotion TEXT,
            engagement_score INTEGER,
            mouse_movements INTEGER,
            clicks INTEGER,
            scroll_count INTEGER,
            idle_time INTEGER,
            face_prob REAL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            url TEXT,
            added_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/predict-emotion', methods=['POST'])
def predict_emotion():
    data = request.json
    emotion = emotion_engine.predict(data)
    
    # Calculate simple engagement score
    engagement_score = 0
    if emotion == 'Engaged': engagement_score = 90
    elif emotion == 'Neutral': engagement_score = 60
    elif emotion == 'Confused': engagement_score = 40
    elif emotion == 'Frustrated': engagement_score = 20
    elif emotion == 'Bored': engagement_score = 10

    # Save to DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO sessions (timestamp, emotion, engagement_score, mouse_movements, clicks, scroll_count, idle_time, face_prob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datetime.datetime.now().isoformat(),
        emotion,
        engagement_score,
        data.get('mouseMovements', 0),
        data.get('clicks', 0),
        data.get('scrollCount', 0),
        data.get('idleTime', 0),
        data.get('faceProb', 0.5)
    ))
    conn.commit()
    conn.close()

    return jsonify({
        'emotion': emotion,
        'confidence': 0.85, # Mock confidence
        'engagement_score': engagement_score,
        'suggestions': get_suggestions(emotion)
    })

@app.route('/resources', methods=['GET', 'POST'])
def handle_resources():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if request.method == 'POST':
        data = request.json
        cursor.execute('INSERT INTO resources (title, url, added_at) VALUES (?, ?, ?)', 
                      (data['title'], data['url'], datetime.datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'})
    
    else:
        cursor.execute('SELECT * FROM resources ORDER BY added_at DESC')
        rows = cursor.fetchall()
        conn.close()
        return jsonify([{'id': r[0], 'title': r[1], 'url': r[2], 'added_at': r[3]} for r in rows])

@app.route('/analytics', methods=['GET'])
def get_analytics():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 50')
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': r[0],
        'timestamp': r[1],
        'emotion': r[2],
        'engagement_score': r[3],
        'mouse_movements': r[4],
        'clicks': r[5],
        'scroll_count': r[6],
        'idle_time': r[7]
    } for r in rows])

def get_suggestions(emotion):
    suggestions = {
        'Engaged': "Keep up the great work! You're in the zone.",
        'Neutral': "You're doing fine. Try to stay focused on the core concepts.",
        'Confused': "This section seems tricky. Maybe try searching for a video explanation?",
        'Frustrated': "It's okay to feel stuck. Take a 2-minute break and come back.",
        'Bored': "Change of pace! Try a quick quiz or interactive exercise."
    }
    return suggestions.get(emotion, "Stay curious!")

if __name__ == '__main__':
    init_db()
    app.run(port=5000, debug=True)
