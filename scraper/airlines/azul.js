const axios = require('axios');
const cheerio = require('cheerio');

// Azul Fidelidade / TudoAzul — monitora promoções de compra de pontos
async function scrapeAzul() {
  const results = [];

  try {
    const { data } = await axios.get('https://www.tudoazul.com.br/comprar-pontos', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);

    // Procura por textos com % de bônus na página
    const bonusPattern = /(\d+)\s*%\s*(de\s+)?(bônus|bonus|desconto)/gi;
    const ratioPattern = /(\d+)\s*(ponto[s]?|point[s]?)\s*[=:por]+\s*(\d+(?:\.\d+)?)\s*(milha[s]?|mile[s]?)/gi;

    const pageText = $('body').text();

    let match;
    while ((match = bonusPattern.exec(pageText)) !== null) {
      const percentage = parseInt(match[1]);
      if (percentage > 0) {
        results.push({
          airline: 'azul',
          airlineName: 'Azul Fidelidade',
          type: 'bonus_percentage',
          value: percentage,
          title: `${percentage}% de bônus na compra de pontos`,
          url: 'https://www.tudoazul.com.br/comprar-pontos',
        });
      }
    }

    while ((match = ratioPattern.exec(pageText)) !== null) {
      const from = parseInt(match[1]);
      const to = parseFloat(match[3]);
      const ratio = to / from;
      results.push({
        airline: 'azul',
        airlineName: 'Azul Fidelidade',
        type: 'ratio',
        value: ratio,
        title: `${from} ponto = ${to} milhas (ratio ${ratio.toFixed(2)})`,
        url: 'https://www.tudoazul.com.br/comprar-pontos',
      });
    }

    // Seletores específicos do TudoAzul (ajustar conforme HTML atual)
    $('[class*="bonus"], [class*="promo"], [class*="oferta"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && /\d+%/.test(text)) {
        const pct = parseInt(text.match(/(\d+)%/)[1]);
        if (pct > 0 && !results.find(r => r.value === pct)) {
          results.push({
            airline: 'azul',
            airlineName: 'Azul Fidelidade',
            type: 'bonus_percentage',
            value: pct,
            title: text.slice(0, 100),
            url: 'https://www.tudoazul.com.br/comprar-pontos',
          });
        }
      }
    });
  } catch (err) {
    console.error('[Azul] Erro no scraping:', err.message);
  }

  return results;
}

module.exports = scrapeAzul;
