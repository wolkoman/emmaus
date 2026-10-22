# Wochenblatt-Analyse: letzte 12 Monate (27.07.2025 – 05.07.2026)

Datenquelle: PocketBase prod (`weeklies`), 48 Ausgaben, Rohdaten (Bild-Blobs
entfernt, Bild-Identität als Hash erhalten) in `weeklies_last12m.json`
(6-Monats-Rohdaten zusätzlich in `weeklies_last6m.json`). Stichtag: 20.07.2026.

Hinweis: Das `sent`-Feld wurde bewusst nicht ausgewertet (mögliche technische
Ursachen, keine verlässliche Aussage über redaktionelle Praxis).

## Struktur einer Ausgabe

Jede Ausgabe besteht aus Tiles: 1× EVENTS (Terminkalender, automatisch aus dem
Kalender), 1× EVANGELIUM (automatisch geladen), und 1–5× ARTICLE (redaktionell).

## Kennzahlen (12 Monate)

| Metrik                                                            | Wert                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Ausgaben                                                          | 48 (lückenlose Abdeckung des Jahres)                                                                                              |
| Artikel gesamt                                                    | 125 (Ø 2,6/Ausgabe, min 1, max 5)                                                                                                 |
| Echte Wiederholungen (Text >80 % identisch bzw. identisches Bild) | 37 (**30 %**)                                                                                                                     |
| Artikellänge (Text)                                               | Ø 332 Zeichen, Median 285, max 987                                                                                                |
| Nur-Bild-Artikel (kein Text)                                      | 7                                                                                                                                 |
| Termine pro Ausgabe                                               | Ø 15,5 (min 11, max 26)                                                                                                           |
| Fixes Standardprogramm (Slots in ≥80 % aller Ausgaben)            | 5 Slots, Ø **37 %** des Kalenders (im letzten Halbjahr allein: 7 Slots, Ø 50 % — das Standardprogramm variiert übers Jahr leicht) |

## Rhythmus: das Format ist bereits flexibel

Der Wochenrhythmus wird heute schon saisonal aufgebrochen:

- **Sommer 2025:** Ausgabe 27.07.–31.08. (**5 Wochen**), mit zwei
  Zwischen-Updates (10.08. und 14.08., jeweils bis 31.08.), die fast nur
  Wiederholungen enthielten (2/2 bzw. 2/2 Artikel wiederholt).
- **Weihnachten:** 24.12.2025–07.01.2026 (**2 Wochen**).
- **Sommer 2026:** 05.07.–02.08. (**4 Wochen**).

## Neue Artikel pro Monat (neu/gesamt)

| Monat   | neu/gesamt |     | Monat   | neu/gesamt |
| ------- | ---------- | --- | ------- | ---------- |
| 2025-08 | 2/7        |     | 2026-02 | 9/11       |
| 2025-09 | 8/9        |     | 2026-03 | 10/15      |
| 2025-10 | 7/11       |     | 2026-04 | 8/9        |
| 2025-11 | **13/16**  |     | 2026-05 | 10/14      |
| 2025-12 | 5/9        |     | 2026-06 | 8/9        |
| 2026-01 | 5/11       |     |         |            |

Ergebnis: **Ø ~8–9 neue Artikel/Monat ≈ 2 neue Artikel/Woche**, mit klarer
Saisonalität — stark im Herbst (Nov: 13) und in der Fastenzeit, schwach im
August, Dezember/Jänner (Feiertagsphase: viel Wiederholung, z. B. Pfarrball).

## Wiederholungen vs. Serien

**Echte Wiederholungen** (Text/Bild praktisch unverändert, 37 Fälle = 30 %):

- „Pfarrball – Eine Nacht in Hollywood“: gleicher Inhalt **5 Ausgaben** (Dez–Jän)
- „Save the date: Pfarrfest“: 4 Ausgaben über den Sommer 2025
- „Brunnenprojekt in Benin“: identisches Bild ohne Text 4 Wochen in Folge
- „Passionsspiele“, „Kreuzweg“, Buchclub-Runde März: gleicher Text 3 Wochen in Folge
- „Rorate“, „Wallfahrt Maria Lanzendorf“: je 3×
- dazu viele 1-wöchige Zweitausstrahlungen von Einladungen

**Serien mit frischem Inhalt** (gleicher Titel, neuer Text):

- „Einladung zum Buchclub“: **10 Erscheinungen** übers Jahr, aber eine laufende
  Reihe mit je neuem Buch, Termin und Text (Ähnlichkeit zwischen Runden ~0,5).
  Reguläres, aktuelles Pfarrleben — keine Redundanz.
- Alphakurs-Einladungen (5 Wochen) variieren den Text leicht pro Woche.

**Impulse** (Fastenimpuls, Gedankenimpuls, Sommer-/Feiertagsgrüße): eigenständig
geschriebene geistliche Kurztexte (~250–500 Zeichen). Redaktioneller Inhalt mit
eigenem Wert — zugleich nicht terminkritisch, funktioniert im Monatsformat
genauso.

## Weitere Beobachtungen

- Ankündigungen haben lange Vorlaufzeiten: Pfarrfest 6 Wochen, Pfarrball 5
  Wochen, Buchclub bis 7 Wochen, Alphakurs 5 Wochen → Inhalte sind überwiegend
  nicht wochenaktuell.
- Der Kalender besteht zu gut einem Drittel (übers Jahr) bis zur Hälfte (letztes
  Halbjahr) aus dem wöchentlich identischen Standardprogramm; der Rest sind
  echte Sondertermine (Ø ~8–10/Woche).
- Dichte Phasen bleiben dicht: November (bis 5 Artikel/Ausgabe) und
  Fastenzeit/Ostern (bis 4 Artikel, 22 Termine).

## Einschätzung pro/contra Monats-Newsletter

Dafür spricht:

- Nur ~2 neue Artikel/Woche; 30 % unveränderte Wiederholungen deuten darauf
  hin, dass Inhalte gestreckt werden, um den Wochenrhythmus zu bedienen.
- In Feiertags-/Ferienphasen (Aug, Dez/Jän) trägt der Wochenrhythmus erkennbar
  nicht — genau dort wird heute schon wiederholt oder zusammengelegt.
- Lange Ankündigungs-Vorlaufzeiten passen gut zu einer Monatsvorschau.
- Impuls-Texte sind zeitlos und im Monatsformat gleichwertig.
- Sommer- und Weihnachts-Mehrwochenausgaben zeigen: das Format funktioniert.
- Aufwand: Jede Wochenausgabe bedeutet redaktionelle Erstellung und Fertigung
  — 48 Ausgaben/Jahr für Ø 2 neue Artikel/Woche. Ein Monatsrhythmus reduziert
  diesen Fixaufwand auf ein Viertel.

Dagegen/zu beachten:

- Kurzfristiges (Blasiussegen, Gedenkmesse, kurzfristige Änderungen) braucht
  einen Kanal mit <1 Monat Latenz. Da EVENTS + EVANGELIUM ohnehin automatisch
  generiert werden, wäre ein hybrides Modell möglich: redaktioneller Teil
  monatlich, automatischer Termin-/Evangeliums-Reminder weiterhin wöchentlich.
- Im Herbst und in der Fastenzeit ist genug wochenaktueller Stoff vorhanden —
  eine saisonale Taktung (monatlich im Sommer/nach Weihnachten, dichter in
  Hochphasen) wäre eine Alternative zum starren Monatsrhythmus.
- Aber: Hybrid- und Saisonmodelle erschweren die Planbarkeit — zwei parallele
  Formate bzw. wechselnde Rhythmen bedeuten mehr Koordinationsaufwand für
  Redaktion und Leserschaft als ein einziger, fixer Takt. Wer Planbarkeit und
  geringen Aufwand priorisiert, fährt mit einem fixen Monats-Newsletter am
  besten.
