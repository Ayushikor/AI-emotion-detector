/**
 * EmotionSense - Background Service Worker
 */

const BACKEND_URL = 'http://localhost:5000'; // Default local Flask URL

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openDashboard",
    title: "Open EmotionSense Dashboard",
    contexts: ["action"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openDashboard") {
    // In a real environment, this opens the dashboard URL
    // For this project, we open the local dashboard.html provided in the extension
    chrome.tabs.create({ url: 'dashboard.html' });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BEHAVIOR_DATA') {
    processEmotion(message.data);
  }
  return true;
});

async function processEmotion(data) {
  try {
    // 1. Basic Rule-based heuristic
    let emotion = detectRuleBasedEmotion(data);
    
    // 2. Try to get prediction from AI Backend
    const response = await fetch(`${BACKEND_URL}/predict-emotion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => null);

    let aiEmotion = null;
    if (response) {
      const result = await response.json();
      aiEmotion = result.emotion;
      console.log('AI Prediction:', aiEmotion);
    }

    const finalEmotion = aiEmotion || emotion;

    // 3. Save to local storage for the popup
    chrome.storage.local.set({ 
      currentEmotion: finalEmotion,
      lastUpdate: new Date().toISOString()
    });

    // 4. Show notification if state is concerning (e.g. Frustrated)
    if (finalEmotion === 'Frustrated' || finalEmotion === 'Bored') {
      showSuggestion(finalEmotion);
    }

  } catch (error) {
    console.error('Error processing emotion:', error);
  }
}

function detectRuleBasedEmotion(data) {
  if (data.clicks > 15) return 'Frustrated'; // Rage clicking
  if (data.idleTime > 60) return 'Bored';
  if (data.scrollCount > 20 && data.mouseMovements < 50) return 'Confused';
  if (data.mouseMovements > 100 && data.windowFocus) return 'Engaged';
  return 'Neutral';
}

function showSuggestion(emotion) {
  let message = "";
  if (emotion === 'Frustrated') message = "Take a deep breath. Would you like to try a simpler resource?";
  if (emotion === 'Bored') message = "Time for a 5-minute movement break!";
  
  if (message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon128.png',
      title: `EmotionSense: You seem ${emotion}`,
      message: message,
      priority: 2
    });
  }
}
