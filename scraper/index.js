const fs = require('fs');
const path = require('path');
const scrapeAzul = require('./airlines/azul');
const scrapeLatam = require('./airlines/latam');
const scrapeSmiles = require('./airlines/smiles');
const sendAlert = require('./notify');

const SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');
const DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'promotions.json');

const scrapers = { azul: scrapeAzul, latam: scrapeLatam, smiles: scrapeSmiles };

function meetsThreshold(promotion, thresholds) {
  if (promotion.type === 'bonus_percentage') {
    return promotion.value >= thresholds.bonusPercentage;
  }
  if (promotion.type === 'ratio') {
    return promotion.value >= thresholds.pointsToMilesRatio;
  }
  return false;
}

async function run() {
  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  const previous = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  const allFound = [];

  for (const airline of settings.airlines) {
    if (!scrapers[airline]) {
      console.warn(`[Main] Scraper não encontrado para: ${airline}`);
      continue;
    }
    console.log(`[Main] Verificando ${airline}...`);
    const results = await scrapers[airline]();
    allFound.push(...results);
    console.log(`[Main] ${airline}: ${results.length} promoção(ões) encontrada(s)`);
  }

  // Filtra apenas as que atingem o threshold
  const qualifying = allFound.filter(p => meetsThreshold(p, settings.thresholds));

  // Detecta promoções novas (não existiam na verificação anterior)
  const previousTitles = new Set((previous.promotions || []).map(p => `${p.airline}|${p.title}`));
  const newPromotions = qualifying.filter(p => !previousTitles.has(`${p.airline}|${p.title}`));

  const timestamp = new Date().toISOString();
  const updatedData = {
    lastChecked: timestamp,
    settings: {
      bonusPercentage: settings.thresholds.bonusPercentage,
      pointsToMilesRatio: settings.thresholds.pointsToMilesRatio,
    },
    promotions: qualifying.map(p => ({
      ...p,
      foundAt: timestamp,
      isNew: newPromotions.some(n => n.airline === p.airline && n.title === p.title),
    })),
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(updatedData, null, 2));
  console.log(`[Main] ${qualifying.length} promoção(ões) qualificada(s) salva(s).`);

  if (newPromotions.length > 0) {
    console.log(`[Main] ${newPromotions.length} promoção(ões) NOVA(S) — enviando alerta.`);
    await sendAlert(newPromotions, settings);
  } else {
    console.log('[Main] Nenhuma promoção nova encontrada.');
  }
}

run().catch(err => {
  console.error('[Main] Erro fatal:', err);
  process.exit(1);
});
