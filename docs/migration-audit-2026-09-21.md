# Migrationsabgleich vom 21. September 2026

Ergebnis: keine vollständige Entwarnung. Der lesende Abgleich umfasst 8.841 Cockpit-Quelldatensätze bzw. abgeflachte Einträge, 18 fachliche Datenbereiche und zusätzlich die 27 `content_assets`. Von 196 Dateipaaren sind 177 bytegleich und gültige Medienantworten; 19 PocketBase-Artikelbilder enthalten HTML statt Bilddaten. Ein Personendatensatz fehlt; vier weitere Datensätze weichen fachlich ab.

Während dieses Gesamtabgleichs wurden keine Produktionsdaten verändert. Die zuvor ausdrücklich genehmigte Wiederherstellung der zwei EB31-Artikel ist im geprüften Stand enthalten.

## Methode

- API-Lesezugriffe, vollständige Ergebnismengen mit Seiten-/Anzahlkontrolle; keine Zugangsdaten im Bericht.
- Abgleich über `cockpit_id`; Cache über Schlüssel, Liturgien über Datum und Position.
- Öffentliche Beiträge haben seit einer späteren Migration keine Cockpit-ID mehr: 138 über eindeutigen Slug, sechs ohne Slug über eindeutigen Titel zugeordnet. Inhalte und Veröffentlichungsdaten wurden danach verglichen; die historische Identität ist dadurch nicht formal bewiesen.
- Feldvergleich entsprechend der tatsächlichen Importabbildung, einschließlich Beziehungen, JSON-Inhalten, Status-Standardwerten, Seitenhierarchie und umgeschriebenen Dateiverweisen.
- Prüfung beobachteter Werte gegen aktuelle Schema-Grenzen sowie aller vier direkt vergleichbaren konfigurierten Select-Felder. Keine weiteren inkompatiblen Auswahlwerte gefunden.
- Keine ungültigen Beziehungen zwischen den geprüften PocketBase-Collections gefunden.
- SHA-256 der kompletten Dateien; Quell- und Zieldatei unabhängig auf HTTP-Fehler und HTML-Ersatzantworten geprüft. Gleiche HTML-Fehlerseiten zählen ausdrücklich nicht als intakte Migration.

## Datenbereiche

„Gleich“ bezieht sich auf die abgebildeten fachlichen Felder nach vorgesehenen Transformationen, nicht auf alle internen Metadaten. Medien werden separat bewertet. Zusätzliche PocketBase-Datensätze sind nicht automatisch Dubletten.

| Bereich | Cockpit | PocketBase | Gleiche Datensätze | Erklärung / offene Punkte |
|---|---:|---:|---:|---|
| `persons` | 33 | 32 | 31 | 1 fehlt; 1 abweichend |
| `liturgy_events` | 152 | 174 | 151 | 1 abweichend; 22 zusätzlich in PB |
| `liturgy_rosters` | 405 | 296 | 265 | 139 schon in Cockpit ohne gültigen Ereignisbezug; 1 abweichend; 30 zusätzlich |
| `cache` | 340 | 284 | 277 | 63 doppelte Quellschlüssel; zuletzt gespeicherter Wert verglichen; 7 zusätzlich |
| `reservations` | 2 | 2 | 2 | Vollständig gleich |
| `newsletter` | 37 | 38 | 37 | 1 zusätzlich |
| `shared_links` | 15 | 15 | 15 | Vollständig gleich |
| `alpha_registrations` | 8 | 8 | 8 | Vollständig gleich |
| `weeklies` | 78 | 77 | 75 | 2 vollständig identische Quelldubletten; 1 Versandstatus abweichend; 1 zusätzlich |
| `paper_projects` | 17 | 18 | 17 | 1 zusätzlich |
| `paper_articles` | 262 | 264 | 262 | Alle 262 einschließlich der reparierten EB31-Artikel; 2 zusätzlich |
| `paper_texts` | 5995 | 5976 | 5976 | 19 Quelltexte ohne noch existierenden Quellartikel |
| `paper_stats` | 171 | 171 | 171 | Vollständig gleich |
| `sites` | 20 | 20 | 20 | Vollständig gleich |
| `articles` | 144 | 146 | 144 | Fachliche Felder einschließlich Veröffentlichungsdatum gleich; 19 Bilddateien defekt; 2 zusätzliche Beiträge |
| `emmausbote` | 25 | 25 | 25 | Vollständig gleich |
| `impressum` | 1 | 1 | 1 | Vollständig gleich |
| `liturgies` | 1136 | 1137 | 1136 | 1 zusätzlich |

## Offene Datensatzabweichungen

- `persons/637c936d626133fcb30000d7`: Quellperson fehlt in PocketBase, auch kein Treffer unter gleichem Namen, Benutzernamen oder E-Mail. Ob absichtlich später gelöscht, ist nicht belegt. Keine automatische Wiederanlage eines Kontos.
- `persons/68409fed6565381a06000348`: `active` und `competences` unterscheiden sich.
- `liturgy_events/6a1d4c443063310e900001d6`: `cancellations` unterscheiden sich.
- `liturgy_rosters/6a4bcba06261399b2b0002df`: `person` und `person_name` unterscheiden sich.
- `weeklies/6a468069383263308800013f`: `sent` unterscheidet sich.

Diese Unterschiede sind nachgewiesen, ihre Ursache nicht. Sie können spätere Änderungen sein und dürfen nicht pauschal mit dem eingefrorenen Cockpit-Stand überschrieben werden.

Die zwei Wochenblatt-Dubletten vom 14.–21. Juni und 28. Juni–5. Juli sind fachlich exakt identisch zu den vorhandenen Kopien. Das damalige Zed-Protokoll dokumentiert die Ablehnung der zweiten Kopie am eindeutigen Namensindex.

## Defekte Artikelbilder

Ursache: Der frühere Downloader setzte auch vor absolute externe URLs den Cockpit-Host. Außerdem akzeptierte er HTTP-200-HTML-Ersatzseiten für ungültige lokale Pfade als Dateien. Bei allen folgenden PocketBase-Dateien wurde HTML nachgewiesen.

Zehn Originalquellen lieferten im aktuellen Lauf Medien; neun lieferten HTML, HTTP 403/404 oder einen Verbindungsfehler. Produktionsreparatur ist noch nicht erfolgt.

| Beitrag | PocketBase-ID | Quelle aktuell |
|---|---|---|
| Kannst Du Dir den Himmel verdienen? | `es2xfc28tmt8hso` | Abrufbar; SHA-256 berechnet |
| Kraft des Gebets: Gemeinsam für Papst Franziskus eintreten! | `5jucl4ai0hmu87g` | Abrufbar; SHA-256 berechnet |
| Sternsinger 2021 gesucht! | `2imud13lnmj7bfu` | HTML instead of media |
| Gottesdienstordnung | `stks5k11n9e0npe` | HTML instead of media |
| "Stephansdom ist ein guter Platz zum Impfen" | `fmwah89wpav1mck` | HTML instead of media |
| Die Katholische Kirche beginnt Ihre Weltsynode | `uqiwojte65eriqk` | Abrufbar; SHA-256 berechnet |
| Gedanken zum Valentinstag:  Das Wichtigste ist die Liebe | `wgxtcbk8qmwdk83` | Abrufbar; SHA-256 berechnet |
| Ukraine: „Das Opfer einer Aggression“ | `6dvvpx3m8w8957o` | HTTP 403 |
| Wir beten für die Ukraine, Russland und ganz Europa. | `y6vlnoavy0ym9sk` | Abrufbar; SHA-256 berechnet |
| Gedanken zur Fastenzeit 2022 | `x9ga0t3hd4kvm4o` | HTTP 404 |
| „Europa betet gemeinsam“  - Wir beten für Frieden | `t5l799t3gkhgg0c` | Abrufbar; SHA-256 berechnet |
| Fastenzeit Impulse | `kk2n4ogpdqn4vvf` | Abrufbar; SHA-256 berechnet |
| Die wunderbare Kraft der Versöhnung und was hat Wittgenstein damit zu tun? | `9vf44jmeihrpy95` | Abrufbar; SHA-256 berechnet |
| Kluger Rat wird zur Stütze. | `4y06drttyxwciix` | Abrufbar; SHA-256 berechnet |
| Die Welt zum Positiven verändern! | `zwpbpmcl7m45t5t` | HTML instead of media |
| Lebkuchen im Sommer und eine heldenhafte Mutter... | `y4yjnq9og5u63vy` | HTTP 403 |
| Fünf Finger im Gebet – Was repräsentiert jeder Finger? | `ds2pt870fke5jwl` | URLError |
| (Lehrreiche) Geschichte zweier Bauarbeiter | `6mkyk072rtdrovj` | HTTP 403 |
| Kirche mitgestalten, meine Erfahrung | `gf7v7mflqnfkkrr` | Abrufbar; SHA-256 berechnet |

## Eingebaute Schutzmaßnahmen

- `scripts/audit-cockpit-to-pb.py`: wiederholbarer Gesamtabgleich; Exit 2 bei prüfpflichtigen Befunden, Exit 1 bei abgebrochenem Audit.
- `scripts/migration-validation.ts`: Auswahlwerte, fehlende Pflichtwerte, unbekannte Zielfelder, Text-/JSON-Größen und Zahlen werden vor den Schreibschleifen der generischen Importphasen geprüft.
- Der Downloader behandelt absolute URLs korrekt und lehnt HTML-Antworten ab.
- Gesammelte Schreib-/Downloadfehler und nicht auflösbare Verknüpfungen beenden den Import mit Fehlerstatus. Frühere erfolgreiche Schreibvorgänge werden nicht automatisch zurückgerollt.
- Das fehlende Eineinhalbseiten-Format ist als idempotente Schema-Migration und in beiden Typsätzen ergänzt.

Validierung: sechs TypeScript-Regressionsprüfungen, fünf Python-Audittests und `tsc --noEmit --incremental false` erfolgreich. Änderungen sind lokal, nicht committet oder deployt.

## Grenzen und bewusst ausgeschlossene Daten

- Lebende Systeme: Die beiden API-Lesestände sind kein gemeinsamer transaktionaler Snapshot.
- PocketBase-Systemtabellen und nach der Migration neu eingeführte Collections sind keine Cockpit-Migrationsziele.
- `article` (Singular) wurde bewusst nicht migriert; WhatsApp-Verifikationen gehören zu einer entfernten Funktion. Der alte Ereignis-Singleton wird vom Anwendungscode nicht mehr gelesen; Kalender kommen aus Google Calendar.
- Superuser wurden selektiv angelegt; keine Gleichheitsbehauptung über sämtliche alten Admin-Konten oder Passwörter.
- Inhalte externer Google-Dokumente, Drive-Dateien und Kalender wurden nicht kopiert und sind nicht Bestandteil dieses Datenbankabgleichs. Ihre gespeicherten Verknüpfungen wurden soweit Teil der migrierten Felder verglichen.
- Ursprüngliche `_created`/`_modified`-Metadaten sind außerhalb der dafür vorgesehenen Inhaltsfelder nicht identisch erhalten; insbesondere setzen PocketBase-Autodatumsfelder bei Redaktionstexten die Importzeit. Dieser Bericht bestätigt Textinhalt und Artikelbezug, nicht die originalen Versionszeitstempel.
- Nicht jede mögliche Validierungsregel oder fachliche Inkonsistenz lässt sich durch Schema-/Feldvergleich ausschließen. Die festgestellten Fehlerpfade sind abgesichert; die offenen Befunde bleiben ausdrücklich offen.
