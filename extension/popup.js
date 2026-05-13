document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('vinted')) {
    alert("Veuillez vous rendre sur Vinted (Profil ou Ventes)");
    return;
  }

  const btn = document.getElementById('scrapeBtn');
  btn.innerText = "Synchronisation...";
  btn.disabled = true;

  chrome.tabs.sendMessage(tab.id, { action: "START_SYNC" }, (response) => {
    btn.innerText = "Lancer la Synchronisation";
    btn.disabled = false;

    if (response && response.data) {
      const resultDiv = document.getElementById('result');
      const copyBtn = document.getElementById('copyBtn');
      const json = JSON.stringify(response.data, null, 2);
      
      resultDiv.innerText = `${response.data.items.length} articles trouvés !`;
      resultDiv.style.display = 'block';
      copyBtn.style.display = 'block';
      
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(json);
        alert("✅ Succès ! Données copiées. Collez-les dans ResellPro.");
      };
    } else {
      alert("Erreur: Impossible de détecter l'interface Vinted. Essayez de rafraîchir la page.");
    }
  });
});
