document.addEventListener('DOMContentLoaded', () => {
  updatePopup();
  setInterval(updatePopup, 2000);

  document.getElementById('view-dashboard').addEventListener('click', () => {
    // In a real extension, this would open a new tab with the dashboard
    // For this project, we assume the dashboard is a web URL or a local HTML file
    chrome.tabs.create({ url: 'dashboard.html' }); 
  });
});

function updatePopup() {
  chrome.storage.local.get(['currentEmotion', 'lastUpdate'], (result) => {
    const emotionEl = document.getElementById('emotion-display');
    const timeEl = document.getElementById('time-display');
    const engagementBar = document.getElementById('engagement-bar');
    const focusScore = document.getElementById('focus-score');

    if (result.currentEmotion) {
      emotionEl.textContent = result.currentEmotion;
      emotionEl.className = `emotion-${result.currentEmotion.toLowerCase()}`;
      
      let engagement = 0;
      let focus = 0;
      
      switch(result.currentEmotion) {
        case 'Engaged': engagement = 90; focus = 95; break;
        case 'Neutral': engagement = 50; focus = 60; break;
        case 'Confused': engagement = 40; focus = 30; break;
        case 'Frustrated': engagement = 20; focus = 15; break;
        case 'Bored': engagement = 10; focus = 5; break;
      }

      if (engagementBar) engagementBar.style.width = `${engagement}%`;
      if (focusScore) focusScore.textContent = focus;
    }

    if (result.lastUpdate && timeEl) {
      const date = new Date(result.lastUpdate);
      timeEl.textContent = `Last update: ${date.toLocaleTimeString()}`;
    }
  });
}
