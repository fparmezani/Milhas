const axios = require('axios');
const cheerio = require('cheerio');

// Smiles (GOL) — monitora promoções de compra de milhas
async function scrapeSmiles() {
  const results = [];

  try {
    const { data } = await axios.get('https://www.smiles.com.br/acumule-milhas/compre-milhas', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);
    const pageText = $('body').text();

    const bonusPattern = /(\d+)\s*%\s*(de\s+)?(bônus|bonus|desconto)/gi;
    const ratioPattern = /(\d+)\s*(ponto[s]?|point[s]?)\s*[=:por]+\s*(\d+(?:\.\d+)?)\s*(milha[s]?|mile[s]?)/gi;

    let match;
    while ((match = bonusPattern.exec(pageText)) !== null) {
      const percentage = parseInt(match[1]);
      if (percentage > 0) {
        results.push({
          airline: 'smiles',
          airlineName: 'Smiles (GOL)',
          type: 'bonus_percentage',
          value: percentage,
          title: `${percentage}% de bônus na compra de milhas`,
          url: 'https://www.smiles.com.br/acumule-milhas/compre-milhas',
        });
      }
    }

    while ((match = ratioPattern.exec(pageText)) !== null) {
      const from = parseInt(match[1]);
      const to = parseFloat(match[3]);
      const ratio = to / from;
      results.push({
        airline: 'smiles',
        airlineName: 'Smiles (GOL)',
        type: 'ratio',
        value: ratio,
        title: `${from} ponto = ${to} milhas (ratio ${ratio.toFixed(2)})`,
        url: 'https://www.smiles.com.br/acumule-milhas/compre-milhas',
      });
    }
  } catch (err) {
    console.error('[Smiles] Erro no scraping:', err.message);
  }

  return results;
}

module.exports = scrapeSmiles;
