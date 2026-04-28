# ✈ Monitor de Milhas

Monitora automaticamente promoções de milhas das principais companhias aéreas brasileiras (Azul Fidelidade, LATAM Pass, Smiles/GOL) e envia um alerta por e-mail quando uma promoção ultrapassa o limite configurado.

## Como funciona

- **GitHub Actions** roda o scraper a cada 6 horas
- O scraper verifica os sites das companhias e busca promoções de bônus na compra de milhas
- Se encontrar promoções acima do seu limite, envia um **e-mail de alerta**
- Os resultados ficam salvos no próprio repositório (`public/data/promotions.json`)
- O **Vercel** serve o dashboard automaticamente a cada novo commit

## Configuração

### 1. Secrets do GitHub

Em `Settings → Secrets and variables → Actions`, adicione:

| Secret | Descrição |
|--------|-----------|
| `GMAIL_USER` | Seu endereço Gmail |
| `GMAIL_PASS` | App Password do Google ([criar aqui](https://myaccount.google.com/apppasswords)) |

> Para criar o App Password é necessário ter a verificação em 2 etapas ativa na conta Google.

### 2. Ajustar os limites

Edite `config/settings.json`:

```json
{
  "notifyEmail": "seu@email.com",
  "airlines": ["azul", "latam", "smiles"],
  "thresholds": {
    "bonusPercentage": 50,
    "pointsToMilesRatio": 2.0
  },
  "checkIntervalHours": 6
}
```

- `bonusPercentage`: alerta se o bônus for ≥ este valor (ex: 50 = 50% de bônus)
- `pointsToMilesRatio`: alerta se a conversão for ≥ este valor (ex: 2.0 = 1 ponto → 2 milhas)

### 3. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte o repositório
2. Clique em **Deploy** — sem alterar nenhuma configuração
3. A cada atualização do scraper, o Vercel redeploya automaticamente

## Rodar localmente

```bash
npm install
npm run scrape   # executa o scraper uma vez
npm run dev      # abre o dashboard em http://localhost:3000
```

Para testar o e-mail localmente, crie um arquivo `.env` (nunca commitar):

```
GMAIL_USER=seu@gmail.com
GMAIL_PASS=sua-app-password
```

E rode com:

```bash
node -e "require('dotenv').config(); require('./scraper')"
```

## Adicionar nova companhia

1. Crie `scraper/airlines/<nome>.js` exportando uma função async que retorna um array de promoções
2. Adicione o módulo em `scraper/index.js` no objeto `scrapers`
3. Adicione o nome em `config/settings.json → airlines[]`

## Estrutura do projeto

```
.github/workflows/monitor.yml   ← cron do GitHub Actions
scraper/
  index.js                      ← orquestrador principal
  notify.js                     ← envio de e-mail
  airlines/                     ← um arquivo por companhia
config/settings.json            ← limites e preferências
public/                         ← site servido pelo Vercel
  data/promotions.json          ← dados atualizados pelo scraper
```
