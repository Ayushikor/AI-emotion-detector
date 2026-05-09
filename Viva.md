# Viva Voice Prep: EmotionSense

### Q1: What is the main goal of this project?
**A:** The goal is to detect and analyze student emotions (like confusion or frustration) using browser behavior to provide real-time study interventions and analytics.

### Q2: Why use Manifest V3 for the extension?
**A:** Manifest V3 is the latest standard for Chrome extensions. It offers better security, privacy, and performance via Service Workers instead of background pages.

### Q3: How do you detect "Confusion" just by mouse movements?
**A:** Confusion is often characterized by repeated scrolling (re-reading), slower average mouse speed, and hovering over certain sections for prolonged periods without clicking.

### Q4: Why did you choose Random Forest for the ML model?
**A:** Random Forest is robust and handles non-linear relationships in tabular behavioral data very well. It's also fast enough for real-time predictions in a Python backend.

### Q5: Is the data tracking a privacy concern?
**A:** Yes, which is why we include a Privacy Policy and focus on behavioral metrics (anonymized) rather than keystroke logging of sensitive information.

### Q6: How does the suggestion engine work?
**A:** It maps predicted emotions to a predefined set of pedagogical interventions (e.g., if Frustrated -> suggest a break; if Confused -> suggest a simpler resource).

### Q7: What are 'Rage Clicks'?
**A:** Rage clicks are multiple rapid clicks in a small area, usually indicating that a UI element isn't responding as the user expects, which is a strong signal of frustration.
