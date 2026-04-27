(function () {
  'use strict';

  let allPromotions = [];
  let activeFilter = 'all';

  const AIRLINE_ICONS = { azul: '🔵', latam: '🔴', smiles: '🟠' };

  async function loadData() {
    try {
      const res = await fetch('data/promotions.json?t=' + Date.now());
      if (!res.ok) throw new Error('Falha ao carregar dados');
      return await res.json();
    } catch (err) {
      console.error('Erro ao carregar promoções:', err);
      return null;
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function renderCard(promo) {
    const icon = AIRLINE_ICONS[promo.airline] || '✈';
    const isPercent = promo.type === 'bonus_percentage';
    const valueDisplay = isPercent
      ? `${promo.value}<span>%</span>`
      : `1:<span>${promo.value.toFixed(2)}</span>`;

    return `
      <div class="promo-card ${promo.isNew ? 'is-new' : ''}" data-airline="${promo.airline}">
        ${promo.isNew ? '<span class="badge-new">Novo</span>' : ''}
        <div class="airline-tag ${promo.airline}">${icon} ${promo.airlineName}</div>
        <div class="promo-value">${valueDisplay}</div>
        <div class="promo-title">${promo.title}</div>
        <div class="promo-date">Encontrado em: ${formatDate(promo.foundAt)}</div>
        <a class="promo-link" href="${promo.url}" target="_blank" rel="noopener">Ver promoção →</a>
      </div>`;
  }

  function renderPromotions(promotions) {
    const container = document.getElementById('promotionsContainer');
    const filtered = activeFilter === 'all'
      ? promotions
      : promotions.filter(p => p.airline === activeFilter);

    if (filtered.length === 0) {
      const msg = activeFilter === 'all'
        ? 'Nenhuma promoção acima do limite no momento.'
        : `Nenhuma promoção da ${activeFilter.toUpperCase()} no momento.`;
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <h3>Tudo monitorado</h3>
          <p>${msg}</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(renderCard).join('');
  }

  function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.airline;
        renderPromotions(allPromotions);
      });
    });
  }

  async function init() {
    setupFilters();

    const data = await loadData();
    if (!data) {
      document.getElementById('promotionsContainer').innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <h3>Erro ao carregar dados</h3>
          <p>Verifique se o GitHub Actions já executou ao menos uma vez.</p>
        </div>`;
      return;
    }

    allPromotions = data.promotions || [];

    document.getElementById('lastChecked').textContent = formatDate(data.lastChecked);
    document.getElementById('totalCount').textContent = allPromotions.length;

    if (data.settings) {
      const { bonusPercentage, pointsToMilesRatio } = data.settings;
      document.getElementById('threshold').textContent =
        `≥ ${bonusPercentage}% bônus  ou  1:${pointsToMilesRatio} ratio`;
    }

    renderPromotions(allPromotions);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
