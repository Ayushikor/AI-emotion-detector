# Project Report: EmotionSense AI

## 1. Abstract
EmotionSense is an innovative learning assistant that leverages Artificial Intelligence to sense student engagement levels during online study. By analyzing subtle behavioral cues like mouse micro-movements and click frequency, the system predicts emotional transitions. This data enables real-time interventions, helping students overcome frustration or boredom before they disengage from their studies.

## 2. Introduction
With the rise of e-learning, the physical distance between teacher and student creates a feedback gap. Teachers cannot see if a student is confused by a paragraph or bored by a video. EmotionSense bridges this gap by providing an automated, AI-driven feedback loop directly in the browser.

## 3. Objectives
- To track non-intrusive behavioral metrics on study platforms.
- To classify behavior into one of five emotional states: Engaged, Neutral, Confused, Frustrated, Bored.
- To provide actionable suggestions for improving learning efficiency.
- To visualize long-term engagement trends for self-reflection.

## 4. Methodology
The system uses a multi-layered approach:
1. **Data Acquisition**: Browser Content Script monitors DOM events.
2. **Feature Engineering**: Raw events are aggregated into metrics like "Click Rate" and "Idle Duration".
3. **Classification**: Metrics are sent to a Python Flask backend hostings a Random Forest Classifier.
4. **Action**: The Background Script triggers browser notifications based on the AI's prediction.

## 5. System Architecture
- **Client**: Chrome Extension (JavaScript, Manifest V3).
- **Server**: Flask API (Python).
- **AI/ML**: Scikit-Learn (Random Forest), Pandas.
- **Database**: SQLite.
- **Frontend**: React.js with Recharts for visualization.

## 6. Advantages
- Non-intrusive (doesn't require a webcam for basic tracking).
- Real-time feedback and intervention.
- Helps in identifying difficult study content through "Confusion" heatmaps.

## 7. Future Scope
- Integration with LMS platforms like Moodle or Google Classroom.
- Incorporating webcam-based eye-tracking for higher accuracy.
- Voice-based coaching triggers when frustration is detected.

## 8. Conclusion
EmotionSense demonstrates the potential of "Affective Computing" in education. By making software emotionally aware, we can create more empathetic and effective digital learning environments.
