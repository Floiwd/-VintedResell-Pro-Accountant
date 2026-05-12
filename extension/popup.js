document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('vinted')) {
    alert("Veuillez vous rendre sur Vinted.fr");
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
    if (response && response.data) {
      const resultDiv = document.getElementById('result');
      const copyBtn = document.getElementById('copyBtn');
      const json = JSON.stringify(response.data, null, 2);
      
      resultDiv.innerText = json;
      resultDiv.style.display = 'block';
      copyBtn.style.display = 'block';
      
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(json);
        alert("Données copiées ! Collez-les maintenant dans ResellPro.");
      });
    } else {
      alert("Erreur lors de l'extraction. Assurez-vous d'être sur la page des transactions.");
    }
  });
});
