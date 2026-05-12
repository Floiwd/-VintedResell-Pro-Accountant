/**
 * ResellPro Vinted Scraper
 * Extracts orders and sales from the current page
 */

function scrapeVintedData() {
  console.log("ResellPro: Début du scan...");
  
  const items = [];
  
  // Scraper les ventes (Sales)
  // Vinted uses different selectors depending on the page
  // This is a simplified version targeting the 'transactions' or 'orders' list
  const orderCards = document.querySelectorAll('.item-card'); // Hypothesis selector
  
  orderCards.forEach(card => {
    try {
      const title = card.querySelector('.item-card__title')?.innerText;
      const priceText = card.querySelector('.item-card__price')?.innerText;
      const brand = card.querySelector('.item-card__brand')?.innerText;
      const img = card.querySelector('img')?.src;
      
      if (title && priceText) {
        items.push({
          title,
          brand: brand || '',
          salePrice: parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.')),
          imageUrl: img || '',
          date: new Date().toISOString().split('T')[0],
          platform: 'VINTED'
        });
      }
    } catch (e) {
      console.error("Erreur sur un article:", e);
    }
  });

  return {
    platform: 'VINTED',
    timestamp: new Date().toISOString(),
    items: items
  };
}

// Listener for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    const data = scrapeVintedData();
    sendResponse({ data });
  }
});
