# Poker Lab (pkr)

Analizzatore probabilistico **Texas Hold'em**, interamente nel browser, gratuito e senza account.

## Utilizzo
Apri [index.html](index.html) in un browser desktop, anche offline. Inserisci le due carte personali, le carte comuni note ed eventuali carte escluse; scegli il numero di avversari e premi **Calcola equity e probabilità**.

## Come calcola
- **500.000 simulazioni Monte Carlo** negli scenari non enumerati.
- **Enumerazione combinatoria esatta** dal flop contro un avversario e al river contro due avversari. Senza carte escluse: flop heads-up **1.070.190 esiti**, turn heads-up **45.540**, river heads-up **990**, river con due avversari **446.985 configurazioni non ordinate** (le etichette dei due avversari sono simmetriche).
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

Le istruzioni tecniche, le invarianti matematiche e i limiti del modello sono documentati in [AGENTS.md](AGENTS.md). La suite locale confronta 10.000 mani da sette carte con un valutatore indipendente e controlla le enumerazioni esatte. La CI aggiunge test **test-only** con due motori esterni: `pokersolver@2.1.4` (JavaScript) e `phevaluator==0.6.0` (Python, derivato da PH Evaluator). Nessuna libreria esterna è necessaria per usare il sito. I test locali possono segnalare uno SKIP per `pokersolver` non installato. **Non si tratta di certificazione formale**; verificare gli esiti reali dei workflow GitHub prima di considerarli passati.

## Limitazioni
- Dashboard progettata **solo per desktop** (da 1280×720, con larghezza minima tecnica di 1190 px).
- L'intervallo di confidenza Monte Carlo è approssimativo e non considera l'incertezza sul comportamento avversario. I risultati esatti dipendono comunque dall'ipotesi di mani avversarie equiprobabili.
- La formula di EV ignora rake, side pot, ulteriori puntate e fold equity.
- Non è un generatore di previsioni certe né un sistema che garantisce vincite.
- Prima di usarlo in una partita con soldi reali controllare le norme applicabili e i regolamenti del casinò o della piattaforma.
