/**
 * EmotionSense - Content Script
 * Monitors user behavior for emotion detection
 */

let behaviorData = {
  mouseMovements: 0,
  clicks: 0,
  scrollCount: 0,
  idleTime: 0,
  tabSwitches: 0,
  lastInteraction: Date.now(),
  typingSpeed: 0,
  keypresses: 0,
  windowFocus: true
};

// Tracking Mouse Movements
document.addEventListener('mousemove', () => {
  behaviorData.mouseMovements++;
  behaviorData.lastInteraction = Date.now();
});

// Tracking Clicks (Rage click detection)
document.addEventListener('click', () => {
  behaviorData.clicks++;
  behaviorData.lastInteraction = Date.now();
});

// Tracking Scroll behavior
window.addEventListener('scroll', () => {
  behaviorData.scrollCount++;
  behaviorData.lastInteraction = Date.now();
});

// Tracking Typing Speed
document.addEventListener('keypress', () => {
  behaviorData.keypresses++;
  behaviorData.lastInteraction = Date.now();
});

// Tracking Window Focus
window.addEventListener('blur', () => {
  behaviorData.windowFocus = false;
  behaviorData.tabSwitches++;
});

window.addEventListener('focus', () => {
  behaviorData.windowFocus = true;
});

// Calculate idle time every second
setInterval(() => {
  const now = Date.now();
  if (now - behaviorData.lastInteraction > 5000) { // If no interaction for 5s
    behaviorData.idleTime += 1;
  }
}, 1000);

// Periodically send data to background script
setInterval(() => {
  chrome.runtime.sendMessage({
    type: 'BEHAVIOR_DATA',
    data: {
      ...behaviorData,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
  
  // Reset counts after sending to focus on intervals
  behaviorData.mouseMovements = 0;
  behaviorData.clicks = 0;
  behaviorData.scrollCount = 0;
  behaviorData.keypresses = 0;
}, 10000); // Every 10 seconds

console.log('EmotionSense tracking active...');
