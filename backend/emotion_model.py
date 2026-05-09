import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

class EmotionModel:
    def __init__(self):
        self.model_path = 'emotion_rf_model.pkl'
        self.emotions = ['Neutral', 'Engaged', 'Confused', 'Frustrated', 'Bored', 'Happy', 'Surprised']
        self.model = self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            return joblib.load(self.model_path)
        else:
            return self.train_initial_model()

    def train_initial_model(self):
        # Create a synthetic dataset with facial features
        # Features: mouseMovements, clicks, scrollCount, idleTime, faceProbability
        data = {
            'mouseMovements': [10, 100, 20, 150, 5, 50, 30],
            'clicks': [2, 5, 3, 20, 1, 4, 10],
            'scrollCount': [5, 15, 30, 10, 2, 5, 5],
            'idleTime': [10, 0, 5, 2, 100, 5, 2],
            'faceProb': [0.1, 0.8, 0.5, 0.9, 0.1, 0.9, 0.8],
            'label': [0, 1, 2, 3, 4, 5, 6] # Indices of self.emotions
        }
        df = pd.DataFrame(data)
        X = df.drop('label', axis=1)
        y = df['label']
        
        clf = RandomForestClassifier(n_estimators=10)
        clf.fit(X, y)
        joblib.dump(clf, self.model_path)
        return clf

    def predict(self, behavioral_data):
        # behavioral_data: {mouseMovements, clicks, scrollCount, idleTime, faceProb}
        features = np.array([[
            behavioral_data.get('mouseMovements', 0),
            behavioral_data.get('clicks', 0),
            behavioral_data.get('scrollCount', 0),
            behavioral_data.get('idleTime', 0),
            behavioral_data.get('faceProb', 0.5) # Default neutral face prob
        ]])
        
        prediction_idx = self.model.predict(features)[0]
        return self.emotions[prediction_idx]

# Singleton instance
emotion_engine = EmotionModel()
