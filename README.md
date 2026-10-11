# Poker Lab (pkr)

Analizzatore probabilistico **Texas Hold'em**, interamente nel browser, gratuito e senza account.

## Utilizzo
Apri [index.html](index.html) in un browser desktop, anche offline. Inserisci le due carte personali, le carte comuni note ed eventuali carte escluse; scegli il numero di avversari e premi **Calcola equity e probabilità**.

## Come calcola
- **500.000 simulazioni Monte Carlo** negli scenari non enumerati.
- **Enumerazione combinatoria esatta** dal turn (quattro o cinque carte comuni) contro un solo avversario; al turn senza carte escluse si considerano 45.540 esiti equiprobabili.
- Probabilità di **vittoria senza pareggio** in evidenza; equity separata come quota media di piatto, considerando gli split. Frequenze di vittoria/pareggio/sconfitta mostrate distintamente.
- Pot odds e valore atteso del call secondo un modello semplificato e dichiarato.
- Le mani avversarie sono considerate **uniformemente casuali**: la stima non incorpora letture o range strategici.

È Texas Hold'em standard: **un solo mazzo di 52 carte per mano**, non più mazzi mescolati.

## Pubblicazione con GitHub Pages
La repository è predisposta per la pubblicazione statica dalla radice del ramo **main**.
Per attivarla: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.

Una volta attivato e concluso il deployment, l'indirizzo previsto è:
https://gernotfound.github.io/pkr/

L'esistenza dei file nella repository non dimostra da sola che il sito sia già online; controllare la sezione Pages e l'URL.

## Sviluppo e verifiche
Non sono necessari npm, server o strumenti di compilazione. Serve Node.js per eseguire i test:

```bash
node --test tests/*.test.cjs
```

Le istruzioni tecniche, le invarianti matematiche e i limiti del modello sono documentati in [AGENTS.md](AGENTS.md). La suite confronta 10.000 mani da sette carte con un secondo valutatore di riferimento, costruito in modo indipendente, e verifica le enumerazioni esatte di turn/river; su GitHub i test vengono eseguiti automaticamente dai workflow CI. Questo **non equivale a una certificazione indipendente esterna**.

## Limitazioni
- Dashboard progettata **solo per desktop** (da 1280×720, con larghezza minima tecnica di 1190 px).
- L'intervallo di confidenza Monte Carlo è approssimativo e non considera l'incertezza sul comportamento avversario.
- La formula di EV ignora rake, side pot, ulteriori puntate e fold equity.
- Non è un generatore di previsioni certe né un sistema che garantisce vincite.
- Prima di usarlo in una partita con soldi reali controllare le norme applicabili e i regolamenti del casinò o della piattaforma.
