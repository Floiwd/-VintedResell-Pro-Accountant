document.getElementById('scrapeBtn').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes('vinted')) { 
    alert('Invalid Context: Open Vinted Profile or Sales page to begin sync.'); return; 
  }
  
  const btn = document.getElementById('scrapeBtn');
  const resultDiv = document.getElementById('result');
  const copyBtn = document.getElementById('copyBtn');
  
  btn.innerText = "INITIALIZING v21.0...";
  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.style.transform = "scale(0.98)";

  chrome.tabs.sendMessage(tab.id, { action: "START_SYNC" }, (response) => {
    btn.innerText = "START STEALTH SYNC";
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.transform = "scale(1)";
    
    if (response && response.success && response.data) {
      const count = response.data.items.length;
      resultDiv.innerHTML = '<div style="color: #10b981; font-weight: 900; margin-bottom: 8px; font-size: 14px;">SYNC SUCCESS</div>' + 
                           '<span style="opacity: 0.7">' + count + ' articles identified in current sector.</span>';
      resultDiv.style.display = 'block';
      copyBtn.style.display = 'block';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
        copyBtn.innerText = "COPIED TO CLIPBOARD!";
        setTimeout(() => { copyBtn.innerText = "COPY TO POWER HUB"; }, 3000);
      };
    } else {
      const errorMsg = response ? (response.error || "Unknown response error") : "Connection lost with content script. Refresh Vinted and retry.";
      alert("STEALTH FAILURE: " + errorMsg);
      btn.innerText = "RETRY SYNC";
    }
  });
};
