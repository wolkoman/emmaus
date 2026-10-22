/**
 * Old Cockpit-era article URLs (`/artikel/<title-slug>`) mapped to the tail of
 * their canonical URL (`<id>/<slug>`). Used by `proxy.ts` to serve those links
 * a real 308 instead of a client-side redirect.
 *
 * GENERATED — do not edit by hand. Run
 * `POCKETBASE_URL=https://db.emmaus.wien bun scripts/generate-legacy-article-redirects.ts`
 * to refresh it. Regenerating is only necessary if an article's title_slug
 * changes; the slug in the target is display-only, and the route corrects a
 * stale one itself.
 */
export const legacyArticleSlugs: Record<string, string> = {
  " AmGlückFehltStetsEinStück": "bben4hhtmn5jrmr/gott-liebt-sie",
  " GlaubeUndStandhaftigkeit": "873fq1m79r5pzc4/jesus-sorge-du-ich-vertraue",
  " Herz_Aschenkreuz_Beziehungsmünze":
    "i1i13i8x5egm68x/herz-aschenkreuz-und-eine-beziehungsmuenze",
  "25jährigesPriesterjubiläumZB":
    "ic0jezan1ubtmep/herzliche-gratulation-zum-25-priesterjubilaeum",
  Adventkranz: "k9nyle2zlyl6x8u/schick-uns-deinen-adventkranz",
  adventkranzsegnung:
    "rkqq9oz3yljt932/unsere-virtuelle-advent-shy-kranzsegnung",
  "adventprogramm-2021": "ezlby8qkr7y212y/das-advent-programm-steht",
  AlteWeisheit: "afbsnppe7djjhk3/alte-weisheit",
  AnGottesSegenIstAllesGelegen:
    "gxkvotujrito18e/sie-geben-der-welt-ein-starkes-zeichen-der-hoffnung",
  AntwortAufAlleLebensfragen:
    "14pfj9fj9rhpadm/denn-bei-gott-sind-alle-dinge-moeglich",
  "aschermittwoch-2021": "xcr7213501xg727/kinderliturgie-am-aschermittwoch",
  "auf-den-kopf-gestellt": "pkwaap7jztp76gq/auf-den-kopf-gestellt",
  AufDemWegZumZiel: "1ko8irclblw7ygu/auf-dem-weg-zum-ziel",
  Begegnung_mit_Jesus_Versöhnung2022:
    "1briirj2bpah4dz/begegnung-mit-jesus-versoehnung-der-heilige-antonius-und-die-geloeschte-suendenliste",
  "Bibel und Zeitung": "169n3k0629a16o9/nachrichten-im-blick-der-bibel-lesen",
  BlaisePascalHerzUndVerstand:
    "hofbj88o1uuf0tk/wenn-gott-sich-ihm-nicht-zu-erkennen-gegeben-haette",
  "carlo-acutis-ein-moderner-heiliger-fuer-die-jugend-von-heute":
    "myu5jlp1llazyau/carlo-acutis-ein-moderner-heiliger-fuer-die-jugend-von-heute",
  Chronik2023: "ypjt3gs4e3mv82v/chronik-2023",
  Dankbarkeit_Maerz2023:
    "pd1hby8rhrqkw7r/was-hat-eine-gluecks-bohne-mit-der-dankbarkeit-zu-tun",
  "das-geschenk-das-sich-jesus-wuenscht":
    "tkbuyk7si8spbkt/das-geschenk-das-sich-jesus-wuenscht",
  "das-war-es-was-mein-herz-begehrte":
    "vzu8ogg3868vxyd/das-war-es-was-mein-herz-begehrte",
  "den-himmel-verdienen": "es2xfc28tmt8hso/kannst-du-dir-den-himmel-verdienen",
  DerAlteMannUndDasPferd: "d46ni9qz15qyi59/dar-alte-mann-und-das-pferd",
  DerEinbrecherUndDie: "mh63cfv1i8gp0on/gott-kann",
  "die-drei-baeume": "31kswflph68i2di/die-drei-baeume",
  "die-erste-predigt-von-papst-leo-xiv-im-wortlaut":
    "y5p4bxeaen9kuro/die-erste-predigt-von-papst-leo-xiv-im-wortlaut",
  "die-weisheit-einer-zitrone": "ky0i71oaemt9hyh/die-weisheit-einer-zitrone",
  DieWunderbareKraftDerVersöhnung:
    "9vf44jmeihrpy95/die-wunderbare-kraft-der-versoehnung-und-was-hat-wittgenstein-damit-zu-tun",
  DonBosco: "mu9r2ek8u9oho3k/ein-leben-fuer-junge-menschen",
  "eine-einfache-freundliche-geste-rettete-ihm-das-leben":
    "xp0xgjkdamzlvil/eine-einfache-freundliche-geste-rettete-ihm-das-leben",
  EinGlasWasser: "47gex1ifjt2rb9q/was-ein-glas-wasser-alles-bewirken-kann",
  EinKindFragt: "kfufbj46tftbfuk/fragen-eines-kindes",
  EinPaarGedankenZumMuttertag2023:
    "9jmww97ucejpqu9/ein-paar-gedanken-zum-muttertag",
  EinPaarSchuhe_Teil2: "nrmnp9fxfy29ndy/ein-paar-schuhe-2",
  EinPaarSchuhe2022: "em6rbcl4oyzo65f/ein-paar-schuhe",
  "erkenne-das-positive-in-deinem-leben-und-sei-dankbar-dafuer":
    "fohuy86s6gd9y0t/erkenne-das-positive-in-deinem-leben-und-sei-dankbar-dafuer",
  Europa_betet_gemeinsam:
    "t5l799t3gkhgg0c/europa-betet-gemeinsam-wir-beten-fuer-frieden",
  "fahrradständer-2022":
    "yvsit0csb3chcf1/park-and-ride-ein-fahrradstaender-fuer-emmaus",
  "fastensuppenessen-2021": "jxdjses55w3cxdo/fastensuppenessen",
  Fastenzeit_Impulse_22: "kk2n4ogpdqn4vvf/fastenzeit-impulse",
  "fastenzeit-platz-schaffen-fuer-gott":
    "ocupdeq9urkh6jg/fastenzeit-platz-schaffen-fuer-gott",
  Firmung_einNeubeginn:
    "fm0dt0fa0lyvnfq/papst-firmung-beginn-der-aktiven-teilhabe-am-kirchlichen-leben",
  FriedeInDerFamilie: "831ihfpcmdh5gn6/geschichten-die-das-leben-schreibt",
  FünfFingerImGebet:
    "ds2pt870fke5jwl/fuenf-finger-im-gebet-was-repraesentiert-jeder-finger",
  "gebet-fuer-oesterreich": "kg54fvncydftv4m/gebet-fuer-oesterreich",
  "gebet-fuer-papst-franziskus":
    "5jucl4ai0hmu87g/kraft-des-gebets-gemeinsam-fuer-papst-franziskus-eintreten",
  "Gebet-um-Frieden-in-Europa_Febr2022":
    "y6vlnoavy0ym9sk/wir-beten-fuer-die-ukraine-russland-und-ganz-europa",
  Gedanken_zur_Fastenzeit_2022: "x9ga0t3hd4kvm4o/gedanken-zur-fastenzeit-2022",
  GedankenZumSonntag: "2mml0melh7x45h4/zimmer-frei-gedanken-zum-sonntag",
  "gefaltete-haende-sind-staerker-als-geballte-faeuste":
    "vy4522vdjf236bq/gefaltete-haende-sind-staerker-als-geballte-faeuste",
  GereimtePredigt2023MB: "h8ezn0ogn5wbhop/gereimte-predigt-2023",
  GibtEsEinLebenNachDerGeburt:
    "9c8oy02smdmt7ne/gibt-es-ein-leben-nach-der-geburt",
  "glaubensabend-01-2022":
    "laesd741z5tj74y/glaubensabend-zusammen-mehr-ueber-unseren-glauben-erfahren",
  Gottesdienstordnung: "stks5k11n9e0npe/gottesdienstordnung",
  "haetten-sie-auch-so-gehandelt":
    "kvdrh09mqg1u7lm/haetten-sie-auch-so-gehandelt",
  Heilung_Lourdes:
    "fn0u7cyoa3122o3/wenn-wissenschaftliche-ueberzeugungen-zusammenbrechen",
  HerrWirBittenDichUmFrieden2022:
    "zwpbpmcl7m45t5t/die-welt-zum-positiven-veraendern",
  "Heute_mache-ich_es_anders": "qz00w4j13kjvq0z/heute-mache-ich-es-anders",
  "ich-bin-bei-dir-liebesbrief-von-jesus":
    "0r6r0hgan5h8m1x/ich-bin-bei-dir-liebesbrief-von-jesus",
  "im-gespraech-mit-pfarrer-zvonko-alles-ist-eine-gnade-gottes":
    "lqc5uryuraf4768/im-gespraech-mit-pfarrer-zvonko-alles-ist-eine-gnade-gottes",
  "impfen-im-stephansdom":
    "fmwah89wpav1mck/stephansdom-ist-ein-guter-platz-zum-impfen",
  InWessenHänden: "sra13eotywfclna/in-wessen-haenden",
  IstGuterRatTeuer_2022: "4y06drttyxwciix/kluger-rat-wird-zur-stuetze",
  "jahr-der-bibel-2021": "mcqxwmqhlmjipvn/bibelsonntag",
  "jahresrueckblick-2025-der-pfarre-emmaus-am-wienerberg":
    "uio6fnkss61e3le/jahresrueckblick-2025-der-pfarre-emmaus-am-wienerberg",
  JahresrueckblickEmmaus2024: "83ll7ptproplxx5/jahresrueckblick-emmaus-2024",
  JesusErwarten: "cnejer0v8dmpws5/macht-euch-bereit-denn-gott-ist-nah",
  "kinderliturgie-14-02-2021": "4w034jw000c69b8/kinderliturgie-am-14-02",
  "kirche-mitgestalten-meine-erfahrung":
    "gf7v7mflqnfkkrr/kirche-mitgestalten-meine-erfahrung",
  "krippenausstellung-2020": "5g4ksxjkzi9jib6/krippenausstellung",
  "kurze-und-knackige-mail-adressen":
    "38z5eroqekq2wl3/kurze-und-knackige-mail-adressen",
  LebkuchenImSommer_:
    "y4yjnq9og5u63vy/lebkuchen-im-sommer-und-eine-heldenhafte-mutter",
  "lehrreiche-geschichte-zweier-bauarbeiter":
    "6mkyk072rtdrovj/lehrreiche-geschichte-zweier-bauarbeiter",
  "livestreams-2021": "hfkjpele4xp07t8/messuebertragungen-fruehjahr-2021",
  "lockdown-wort-des-pfarrers":
    "vwfw98cw09p5vhr/ein-besonderes-wort-des-pfarrers",
  lockdown4: "gkuqlm2n4pnj5sz/gottesdienste-im-lockdown-moeglich",
  "mehr-als-nur-fasten":
    "vhmq5xc095fe96f/ostervorbereitung-mehr-als-nur-fasten",
  motorradsegnung: "jszsadt9elr4h7p/motorradsegnung-am-tesarekplatz",
  Muttertag_2022: "64mv8w7c3h1uqx6/muttertag-ist-eigentlich-vom-1-1-bis-31-12",
  Novene: "sgyniy3sktezqub/novene-zum-jahresbeginn-2021",
  OderSchaustDuWeg: "fl4tyy08y9fq9a2/im-dienst-der-menschen",
  OhGnadeGottesWunderbar: "s385c54iu8lbegd/amazing-grace-der-retter-ist-da",
  PaterBernhardSollKommen2023: "urhlyry24isvgkh/pater-bernhard-soll-kommen",
  "pfarrer-und-team": "7n4wd6pmu61x78j/pfarrer-team",
  "pfarrwebsite-emmaus-2022": "fosbdhsvpdmepmu/pfarrwebsite-bearbeiten",
  Pfingsten_2022: "uc1z4ua3y1mlvbm/komm-heiliger-geist",
  Pfingsten2024: "uanr3vc0igva51o/veni-sancte-spiritus",
  PGR_Wahl_2022_Ergebnis: "ke3f5e5uit29q4t/ergebnis-der-pgr-wahl-2022",
  "plan-für-lockdown": "va3pntz1yuxaaks/der-plan-fuer-den-lockdown",
  RapidVsTaufe2023: "e0jq7iw4uakn8dh/was-hat-rapid-mit-der-taufe-zu-tun",
  "ruhe-in-frieden-liesl": "we2ek4o0qkah3kf/ruhe-in-frieden-liebe-liesl",
  "seelenmesse-heinbach":
    "ck7g7xkh5fvqhxp/seelenmesse-fuer-ingrid-heinbach-am-21-12",
  "sie-haben-gott-gefunden": "46ppnzyxfi8hhhh/sie-haben-gott-gefunden",
  Sommer_Urlaub2022:
    "0gay4ubv1m4f5mh/sommer-eine-seltsame-frage-und-der-platz-im-himmel",
  Stadt: "hj58w2bbq2z519u/fuer-die-stadt-in-der-wir-wohnen",
  "Sternsinger 2020": "2imud13lnmj7bfu/sternsinger-2021-gesucht",
  Sternsingeraktion2021: "56qm5xl4jn8k4l2/spendenaufruf-sternsingeraktion-2021",
  SternsingerinderKirche: "fu7uri5c1q941m9/die-sternsinger-sind-in-der-kirche",
  "Stille_Tage ": "wh8tvqr96def4u3/letzte-worte-grosser-persoenlichkeiten",
  "synode-2021":
    "uqiwojte65eriqk/die-katholische-kirche-beginnt-ihre-weltsynode",
  "texte-erster-jänner": "84osnf48cbzc3oa/texte-zur-messe-am-01-01",
  "ukraine-das-opfer-einer-aggression":
    "6dvvpx3m8w8957o/ukraine-das-opfer-einer-aggression",
  Valentinstag_2022:
    "wgxtcbk8qmwdk83/gedanken-zum-valentinstag-das-wichtigste-ist-die-liebe",
  Valtentinstag: "ptolggdc8d85uoz/das-wichtigste-ist-die-liebe",
  Vatertag_2022: "nevs27h08yy291c/ein-guter-vater-gibt-es-perfekte-vaeter",
  VertrauenInGottesFührung:
    "y8hdasupy7kdlto/wie-weit-geht-ihr-vertrauen-in-gottes-fuehrung",
  Wahre_menschliche_Groesse:
    "wyyazkak66zyl1n/an-ihren-fruechten-werdet-ihr-sie-erkennen",
  "Was im Herzen ist": "78hkhmpnu16yhxo/die-sprache-des-herzens",
  "was-hat-eine-kartoffel-mit-dem-aerger-zu-tun":
    "frw90xnnvbenp4p/was-hat-eine-kartoffel-mit-dem-aerger-zu-tun",
  "website-2022-05": "7x50s58g9uk40cf/eni-wien-update-05-22",
  Weihnachten2023: "3carfkjkpqcek7l/die-schoensten-bibelverse-zu-weihnachten",
  Weihnachtsgeschichte2022:
    "ywpn71hxuls103x/der-lange-weg-ein-teil-des-geschenkes",
  "weihnachtswuensche-2021": "lrrmyawqyoqhm01/froehliche-weihnachten",
  Weltjugendtag2023Lissabon: "pd320fuh5axjv13/weltjugendtag-2023-lissabon",
  WertschätzungWichtigerAlsBrot_2022:
    "dpdk2oc4nwa4dsz/wertschaetzung-wichtiger-als-brot",
  "wieder-ffp2": "x81l5ca4mxfvvs4/zum-schutz-aller-ffp2-maske",
  "willkommen-kaplan-romaric": "37raqea0fsauvi8/unser-neuer-kaplan-romaric",
  "wo-heilung-beginnt": "e7ocxbbvo16bffj/wo-heilung-beginnt",
  "wochenmitteilung-verteiler":
    "qdj9islxg5y9b3o/wochenmitteilung-mailverteiler",
  "wort-des-pfarrers-13-sonntag-im-jahreskreis-2021":
    "ugpus4xgcfhxmsw/wort-des-pfarrers-zum-13-sonntag-im-jahreskreis",
  "wort-des-pfarrers-fasten-2021":
    "aw8flohbl3dbpu6/wort-des-pfarrers-zum-1-fastensonntag",
  "worte-des-pfarrers-10-sonntag-im-jahreskreis-2021":
    "sx7blw8t0e58ltn/wort-des-pfarrers-zum-10-sonntag-im-jahreskreis",
  "worte-des-pfarrers-11-sonntag-im-jahreskreis-2021":
    "ebyus0omuc5u6yx/wort-des-pfarrers-zum-11-sonntag-im-jahreskreis",
  "worte-des-pfarrers-12-sonntag-im-jahreskreis-2021":
    "753lequ743083pf/wort-des-pfarrers-zum-12-sonntag-im-jahreskreis",
  "worte-des-pfarrers-2-2021":
    "uegrqj48avf2xmh/wort-des-pfarrers-zum-2-fastensonntag",
  "worte-des-pfarrers-2-sonntag-der-osterzeit-2021":
    "cpftc5leaopz2j6/wort-des-pfarrers-zum-2-sonntag-der-osterzeit",
  "worte-des-pfarrers-3-sonntag-der-osterzeit-2021":
    "8nry69zo5b2q5re/wort-des-pfarrers-zum-3-sonntag-der-osterzeit",
  "worte-des-pfarrers-4-sonntag-der-osterzeit-2021":
    "ek5jkyl550rh6uv/wort-des-pfarrers-zum-4-sonntag-der-osterzeit",
  "worte-des-pfarrers-5-sonntag-der-osterzeit-2021":
    "tokxt5v31mk6a15/wort-des-pfarrers-zum-5-sonntag-der-osterzeit",
  "worte-des-pfarrers-7-sonntag-der-osterzeit-2021":
    "mpoayyil9u97q5u/wort-des-pfarrers-zum-7-sonntag-der-osterzeit",
  "worte-des-pfarrers-dreifaltigkeitssonntag-2021":
    "tvb8fnflzempbsa/wort-des-pfarrers-zum-dreifaltigkeitssonntag",
  "worte-des-pfarrers-dritter-fasten-2021":
    "eusmniyu5k1h3qz/wort-des-pfarrers-zum-3-fastensonntag",
  "worte-des-pfarrers-fuenfter-fasten-2021":
    "g8fwh3hhy5cy5k6/wort-des-pfarrers-zum-5-fastensonntag",
  "worte-des-pfarrers-muttertag-2021":
    "b5wb81cv7csrbcl/wort-des-pfarrers-zum-muttertag",
  "worte-des-pfarrers-ostersonntag-2021":
    "9emyy1jhs5boljc/wort-des-pfarrers-zum-ostersonntag",
  "worte-des-pfarrers-palmsonntag-2021":
    "mg7wyimkc4as670/wort-des-pfarrers-zum-palmsonntag",
  "worte-des-pfarrers-vierter-fasten-2021":
    "im8u5oqgefcuea3/wort-des-pfarrers-zum-4-fastensonntag",
  WortemitGott: "bwe64wpxgvoyvge/worte-mit-gott",
  "zukunft-2024":
    "q5kvhaxccdpe04v/wichtige-mitteilung-zur-zukuenftigen-pastoralen-betreuung-unserer-pfarre",
};
