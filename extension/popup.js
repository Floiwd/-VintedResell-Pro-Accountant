document.getElementById('scrapeBtn').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes('vinted')) { 
    alert('Please open Vinted page (Profile or Transactions)'); return; 
  }
  
  const btn = document.getElementById('scrapeBtn');
  btn.innerText = "SYNCING v20.0...";
  btn.disabled = true;
  btn.style.opacity = '0.5';

  chrome.tabs.sendMessage(tab.id, { action: "START_SYNC" }, (response) => {
    btn.innerText = "START STEALTH SYNC";
    btn.disabled = false;
    btn.style.opacity = '1';
    
    if (response && response.success && response.data) {
      const count = response.data.items.length;
      document.getElementById('result').innerHTML = '<div style="color: #10b981; font-weight: 900; margin-bottom: 8px;">EXTRACTION v20.0 OK</div>' + count + ' articles identifiés.';
      document.getElementById('result').style.display = 'block';
      document.getElementById('copyBtn').style.display = 'block';
      document.getElementById('copyBtn').onclick = () => {
        navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
        alert("Success ! Données copiées. Collez-les maintenant dans le Power Hub.");
      };
    } else {
      alert("Error: " + (response ? response.error : "No response from script. Refresh Vinted and try again."));
    }
  });
};
