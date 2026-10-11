# AGENTS.md — Poker Lab (pkr)

## Missione e ambito
Poker Lab è un analizzatore probabilistico didattico per **Texas Hold'em**. L'obiettivo è fornire risultati matematicamente corretti, spiegabili e riproducibili rispetto alle ipotesi del modello. Non promettere mai di prevedere carte future, mani nascoste o profitti.

## Stato e architettura (11 ottobre 2026)
- Repository: https://github.com/gernotfound/pkr
- Applicazione: **index.html** nella radice, HTML + CSS + JavaScript vanilla, esecuzione interamente lato client, senza API, account, database, framework o build.
- Pubblicazione prevista: **GitHub Pages**, sorgente ramo **main**, cartella **/(root)**. L'abilitazione di Pages nelle impostazioni GitHub è distinta dal caricamento dei file; verificare sempre lo stato reale.
- Interfaccia: **solo desktop**, dashboard su una schermata; target verificati nella versione iniziale: 1280×720, 1366×768, 1440×900, 1920×1080. Non introdurre layout mobile senza nuova richiesta.
- File: index.html (app), README.md (istruzioni), AGENTS.md (contesto e contratti), tests/engine.test.cjs (test di regressione).
- Flusso: preferire **main**, commit logici minimizzati; non creare branch/PR non necessari. Nessuna modifica distruttiva o pubblicazione dichiarata riuscita senza riscontro.

## Contratti matematici NON negoziabili
1. **Un solo mazzo di 52 carte fisicamente distinte** (13 valori × 4 semi); nel Texas Hold'em standard i casinò possono alternare mazzi fra le mani, non mescolarli in una singola mano. Non aggiungere modalità multimazzo senza definire un altro gioco.
2. Due carte private al giocatore; carte comuni in quantità 0, 3, 4 o 5; carte morte/escluse note opzionali; nessuna carta duplicata fra gli insiemi.
3. Fino a otto avversari, con carte private disgiunte e distribuite senza reinserimento; il board sconosciuto è estratto dallo stesso insieme residuo.
4. Valutare la **migliore combinazione su cinque carte** fra le cinque-sette disponibili, confrontando categoria e kicker. La scala A-2-3-4-5 è la più bassa. Gestire correttamente split pot, board condiviso e parità fra più giocatori.
5. Per un esito vittorioso esclusivo la quota del piatto è 1; per una parità al primo posto fra N giocatori (incluso l'utente) è 1/N; se un avversario vince è 0. **Equity = media delle quote del piatto**, NON probabilità pura di vittoria.
6. Contro avversari uniformemente casuali, al **river contro un solo avversario** usare enumerazione esatta di tutte le coppie residue. Negli altri casi usare **500.000 campioni Monte Carlo fissi**, estratti uniformemente senza reinserimento. Non reintrodurre un selettore di campioni.
7. L'intervallo di confidenza esposto è **approssimativo al 95%** e riguarda l'errore di campionamento della media delle quote, NON l'incertezza sul range reale degli avversari. Un risultato esatto vale solo rispetto al modello e alle carte note.
8. Per il solo caso semplificato di call fino allo showdown: pot odds minime = costo_call / (piatto_attuale + costo_call), EV_call = equity × (piatto_attuale + costo_call) − costo_call. Presupposti: piatto inserito prima del proprio call, nessun rake, side pot, puntata futura o fold equity. Non usare queste formule come consiglio universalmente ottimale.
9. Il modello attuale assume mani avversarie **uniformemente casuali**; non interpreta posizione, azioni, bet sizing o range. Evidenziare sempre questo limite. Le probabilità delle carte residue non predicono carte specifiche.
10. Input vuoti, fuori intervallo, non numerici o combinazioni impossibili non devono produrre numeri apparentemente validi.

## UX da preservare
- Interfaccia in italiano, dark theme, selezione delle 52 carte, mani proprie, board, carte escluse, avversari, equity, vittoria/pareggio/sconfitta, combinazioni, pot odds/EV, carte non osservate.
- **Nessun pulsante «Esempio».** Un solo comando di calcolo; pulsante di interruzione se la simulazione è in corso.
- Distinguere i risultati «esatti» da quelli «stimati» e lasciare visibili limitazioni ed errori di input.
- Evitare dipendenze esterne per preservare l'uso offline e la distribuzione gratuita con GitHub Pages.

## Procedura di modifica per gli agenti
1. Leggere la versione **attuale** di index.html, AGENTS.md, test e configurazione della repository; non assumere che queste note sostituiscano l'evidenza del codice.
2. Analizzare invarianti, chiamanti e casi limite prima di modificare logica matematica o UI.
3. Applicare modifiche minime e coerenti; non cambiare formule o contratti implicitamente.
4. Eseguire **node --test tests/engine.test.cjs** sulla versione candidata. Per modifiche UI, verificare realmente in un browser desktop risoluzioni e overflow.
5. Per algoritmi probabilistici, usare confronti con risultati combinatori esatti, test deterministici e verifiche di campionamento con tolleranze motivate. Non considerare i test verdi prova completa.
6. Verificare sintassi, accessibilità di base, assenza di dipendenze esterne e funzionamento su percorso GitHub Pages /pkr/.
7. Distinguere sempre: test locali, commit su main, job GitHub Pages e URL pubblico effettivamente raggiungibile.
8. Aggiornare AGENTS.md e README.md quando cambiano contratti, struttura, istruzioni o limiti; evitare documentazione ridondante o obsoleta.

## Limiti e miglioramenti futuri (NON già implementati)
- Range avversari configurabili e condizionati alle azioni.
- Enumerazione esatta in ulteriori scenari se computazionalmente gestibile.
- Modello economico per rake, side pot, puntate successive e fold equity.
- Rafforzamento metodologico degli intervalli statistici e dei test esaustivi.

## Uso responsabile
È uno strumento di analisi/allenamento, non una garanzia di risultato. L'uso in tempo reale durante partite con denaro reale può violare regolamenti di piattaforme/casinò o leggi locali: non dichiararlo universalmente consentito. Non introdurre tracciamento utenti, credenziali o API key nel codice statico.
