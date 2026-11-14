/**
 * The readings of the Carlo Acutis Mass as subtitles: one cue per sense line,
 * each in all four languages, shown one below the other while it is read.
 * Each starts with the lectionary's announcement of the reading; before it the
 * overlay shows only the Bible reference, rotating through the languages.
 * German: Einheitsübersetzung 2016; Croatian, Italian (CEI 2008) and English
 * (NABRE): as sent by the parish.
 */

export const READING_LANGS = ["de", "hr", "it", "en"] as const;

type Texts = Record<(typeof READING_LANGS)[number], string>;

/** `label` (Lesung, Evangelium) stands small above the `reference`. */
export const READINGS: Record<string, { label: Texts; reference: Texts; cues: Texts[] }> = {
  // Jes 61,1-2. The sentence goes on in v. 3; ending here is still open.
  isaiah: {
    label: { de: "Lesung", hr: "Čitanje", it: "Lettura", en: "Reading" },
    reference: { de: "Jesaja 61,1-2", hr: "Izaija 61, 1-2", it: "Isaia 61,1-2", en: "Isaiah 61:1-2" },
    cues: [
      {
        de: "Lesung aus dem Buch Jesaja",
        hr: "Čitanje Knjige proroka Izaije",
        it: "Dal libro del profeta Isaia",
        en: "A reading from the Book of the Prophet Isaiah",
      },
      {
        de: "Der Geist Gottes, des Herrn, ruht auf mir.",
        hr: "Duh Jahve Gospoda na meni je,",
        it: "Lo spirito del Signore Dio è su di me,",
        en: "The spirit of the Lord GOD is upon me,",
      },
      {
        de: "Denn der Herr hat mich gesalbt;",
        hr: "jer me Jahve pomaza,",
        it: "perché il Signore mi ha consacrato con l'unzione;",
        en: "because the LORD has anointed me;",
      },
      {
        de: "er hat mich gesandt, um den Armen frohe Botschaft zu bringen,",
        hr: "posla me da radosnu vijest donesem ubogima,",
        it: "mi ha mandato a portare il lieto annuncio ai miseri,",
        en: "he has sent me to bring good news to the afflicted,",
      },
      {
        de: "um die zu heilen, die gebrochenen Herzens sind,",
        hr: "da iscijelim srca slomljena;",
        it: "a fasciare le piaghe dei cuori spezzati,",
        en: "to bind up the brokenhearted,",
      },
      {
        de: "um den Gefangenen Freilassung auszurufen",
        hr: "da zarobljenima navijestim slobodu",
        it: "a proclamare la libertà degli schiavi,",
        en: "to proclaim liberty to the captives,",
      },
      {
        de: "und den Gefesselten Befreiung,",
        hr: "i oslobođenje sužnjevima;",
        it: "la scarcerazione dei prigionieri,",
        en: "release to the prisoners,",
      },
      {
        de: "um ein Gnadenjahr des Herrn auszurufen,",
        hr: "da navijestim godinu milosti Jahvine",
        it: "a promulgare l'anno di grazia del Signore,",
        en: "to announce a year of favor from the LORD",
      },
      {
        de: "einen Tag der Vergeltung für unseren Gott,",
        hr: "i dan odmazde Boga našega;",
        it: "il giorno di vendetta del nostro Dio,",
        en: "and a day of vindication by our God;",
      },
      {
        de: "um alle Trauernden zu trösten.",
        hr: "da razveselim ožalošćene na Sionu.",
        it: "per consolare tutti gli afflitti.",
        en: "to comfort all who mourn.",
      },
    ],
  },

  // Mt 12,46-50; read twice (German, then Italian), so it is started again for the second reading.
  gospel: {
    label: { de: "Evangelium", hr: "Evanđelje", it: "Vangelo", en: "Gospel" },
    reference: { de: "Matthäus 12,46-50", hr: "Matej 12, 46-50", it: "Matteo 12,46-50", en: "Matthew 12:46-50" },
    cues: [
      {
        de: "Aus dem heiligen Evangelium nach Matthäus",
        hr: "Čitanje svetog Evanđelja po Mateju",
        it: "Dal Vangelo secondo Matteo",
        en: "A reading from the holy Gospel according to Matthew",
      },
      {
        de: "Als Jesus noch mit den Leuten redete,",
        hr: "Dok on još govoraše mnoštvu,",
        it: "Mentre egli parlava ancora alla folla,",
        en: "While he was still speaking to the crowds,",
      },
      {
        de: "siehe, da standen seine Mutter und seine Brüder draußen",
        hr: "eto majke i braće njegove.",
        it: "ecco, sua madre e i suoi fratelli stavano fuori",
        en: "his mother and his brothers appeared outside,",
      },
      {
        de: "und wollten mit ihm sprechen.",
        hr: "Stajahu vani tražeći da s njime govore.",
        it: "e cercavano di parlargli.",
        en: "wishing to speak with him.",
      },
      {
        de: "Da sagte jemand zu ihm:",
        hr: "Reče mu netko:",
        it: "Qualcuno gli disse:",
        en: "Someone told him,",
      },
      {
        de: "Siehe, deine Mutter und deine Brüder stehen draußen",
        hr: "»Evo majke tvoje i braće tvoje, vani stoje",
        it: "“Ecco, tua madre e i tuoi fratelli stanno fuori",
        en: "“Your mother and your brothers are standing outside,",
      },
      {
        de: "und wollen mit dir sprechen.",
        hr: "i traže da s tobom govore.«",
        it: "e cercano di parlarti”.",
        en: "asking to speak with you.”",
      },
      {
        de: "Dem, der ihm das gesagt hatte, erwiderte er:",
        hr: "Tomu koji mu to javi on odgovori:",
        it: "Ed egli, rispondendo a chi gli parlava, disse:",
        en: "But he said in reply to the one who told him,",
      },
      {
        de: "Wer ist meine Mutter und wer sind meine Brüder?",
        hr: "»Tko je majka moja, tko li braća moja?«",
        it: "“Chi è mia madre e chi sono i miei fratelli?”.",
        en: "“Who is my mother? Who are my brothers?”",
      },
      {
        de: "Und er streckte die Hand über seine Jünger aus und sagte:",
        hr: "I pruži ruku prema učenicima:",
        it: "Poi, tendendo la mano verso i suoi discepoli, disse:",
        en: "And stretching out his hand toward his disciples, he said,",
      },
      {
        de: "Siehe, meine Mutter und meine Brüder.",
        hr: "»Evo«, reče, »majke moje i braće moje!",
        it: "“Ecco mia madre e i miei fratelli!",
        en: "“Here are my mother and my brothers.",
      },
      {
        de: "Denn wer den Willen meines himmlischen Vaters tut,",
        hr: "Doista, tko god vrši volju Oca mojega, koji je na nebesima,",
        it: "Perché chiunque fa la volontà del Padre mio che è nei cieli,",
        en: "For whoever does the will of my heavenly Father",
      },
      {
        de: "der ist für mich Bruder und Schwester und Mutter.",
        hr: "taj mi je brat i sestra i majka.«",
        it: "egli è per me fratello, sorella e madre”.",
        en: "is my brother, and sister, and mother.”",
      },
    ],
  },

  // Test Mass, Sunday 15 November 2026 (St. Leopold, Vienna): first reading Spr 3,13-20.
  proverbs: {
    label: { de: "Lesung", hr: "Čitanje", it: "Lettura", en: "Reading" },
    reference: { de: "Sprichwörter 3,13-20", hr: "Mudre izreke 3, 13-20", it: "Proverbi 3,13-20", en: "Proverbs 3:13-20" },
    cues: [
      {
        de: "Lesung aus dem Buch der Sprichwörter",
        hr: "Čitanje Knjige Mudrih izreka",
        it: "Dal libro dei Proverbi",
        en: "A reading from the Book of Proverbs",
      },
      {
        de: "Selig der Mensch, der Weisheit gefunden,",
        hr: "Blago čovjeku koji je stekao mudrost",
        it: "Beato l'uomo che ha trovato la sapienza,",
        en: "Happy the one who finds wisdom,",
      },
      {
        de: "der Mensch, der Einsicht gewonnen hat.",
        hr: "i čovjeku koji je zadobio razboritost.",
        it: "l'uomo che ottiene il discernimento:",
        en: "the one who gains understanding!",
      },
      {
        de: "Denn sie zu erwerben ist besser als Silber,",
        hr: "Jer bolje je steći nju nego steći srebro,",
        it: "è una rendita che vale più dell'argento",
        en: "Her profit is better than profit in silver,",
      },
      {
        de: "sie zu gewinnen ist besser als Gold.",
        hr: "i veći je dobitak ona i od zlata.",
        it: "e un provento superiore a quello dell'oro.",
        en: "and better than gold is her revenue;",
      },
      {
        de: "Sie übertrifft die Perlen an Wert,",
        hr: "Skupocjenija je od bisera,",
        it: "La sapienza è più preziosa di ogni perla",
        en: "she is more precious than corals,",
      },
      {
        de: "keine deiner Kostbarkeiten kommt ihr gleich.",
        hr: "i što je god tvojih dragocjenosti, s njome se porediti ne mogu;",
        it: "e quanto puoi desiderare non l'eguaglia.",
        en: "and no treasure of yours can compare with her.",
      },
      {
        de: "Langes Leben birgt sie in ihrer Rechten,",
        hr: "dug joj je život u desnoj ruci,",
        it: "Lunghi giorni sono nella sua destra",
        en: "Long life is in her right hand,",
      },
      {
        de: "in ihrer Linken Reichtum und Ehre;",
        hr: "a u lijevoj bogatstvo i čast.",
        it: "e nella sua sinistra ricchezza e onore;",
        en: "in her left are riches and honor;",
      },
      {
        de: "ihre Wege sind schöne Wege,",
        hr: "Njezini su putovi putovi miline",
        it: "le sue vie sono vie deliziose",
        en: "her ways are pleasant ways,",
      },
      {
        de: "all ihre Pfade führen zum Glück.",
        hr: "i sve su njene staze pune spokoja.",
        it: "e tutti i suoi sentieri conducono al benessere.",
        en: "and all her paths are peace;",
      },
      {
        de: "Ein Lebensbaum ist sie denen, die nach ihr greifen,",
        hr: "Životno je drvo onima koji se nje drže",
        it: "È un albero di vita per chi l'afferra,",
        en: "she is a tree of life to those who grasp her,",
      },
      {
        de: "wer sie festhält, ist glücklich zu preisen.",
        hr: "i sretan je onaj tko je zadrži.",
        it: "e chi ad essa si stringe è beato.",
        en: "and those who hold her fast are happy.",
      },
      {
        de: "Der Herr hat die Erde mit Weisheit gegründet",
        hr: "Jahve je mudrošću utemeljio zemlju",
        it: "Il Signore ha fondato la terra con sapienza,",
        en: "The LORD by wisdom founded the earth,",
      },
      {
        de: "und mit Einsicht den Himmel befestigt.",
        hr: "i umom utvrdio nebesa;",
        it: "ha consolidato i cieli con intelligenza;",
        en: "established the heavens by understanding;",
      },
      {
        de: "Durch sein Wissen brechen die tiefen Quellen hervor",
        hr: "njegovim su se znanjem otvorili bezdani",
        it: "con la sua scienza si aprirono gli abissi",
        en: "by his knowledge the depths are split,",
      },
      {
        de: "und träufeln die Wolken den Tau herab.",
        hr: "i oblaci osuli rosom.",
        it: "e le nubi stillano rugiada.",
        en: "and the clouds drop down dew.",
      },
    ],
  },

  // Test Mass, Sunday 15 November 2026: gospel Lk 19,12-26 (the Croatian text runs on to v. 27; cut at 26).
  luke: {
    label: { de: "Evangelium", hr: "Evanđelje", it: "Vangelo", en: "Gospel" },
    reference: { de: "Lukas 19,12-26", hr: "Luka 19, 12-26", it: "Luca 19,12-26", en: "Luke 19:12-26" },
    cues: [
      {
        de: "Aus dem heiligen Evangelium nach Lukas",
        hr: "Čitanje svetog Evanđelja po Luki",
        it: "Dal Vangelo secondo Luca",
        en: "A reading from the holy Gospel according to Luke",
      },
      {
        de: "Er sagte: Ein Mann von vornehmer Herkunft wollte in ein fernes Land reisen,",
        hr: "Reče dakle: »Neki je ugledan čovjek imao otputovati u daleku zemlju",
        it: "Disse dunque: «Un uomo di nobile famiglia partì per un paese lontano,",
        en: "So he said, “A nobleman went off to a distant country",
      },
      {
        de: "um die Königswürde für sich zu erlangen und dann zurückzukehren.",
        hr: "da primi svoje kraljevstvo pa da se vrati.",
        it: "per ricevere il titolo di re e poi ritornare.",
        en: "to obtain the kingship for himself and then to return.",
      },
      {
        de: "Er rief zehn seiner Diener zu sich, verteilte unter sie zehn Minen",
        hr: "Dozva svojih deset slugu, dade im deset mna",
        it: "Chiamati dieci dei suoi servi, consegnò loro dieci monete d'oro,",
        en: "He called ten of his servants and gave them ten gold coins",
      },
      {
        de: "und sagte: Macht Geschäfte damit, bis ich wiederkomme!",
        hr: "i reče: ‘Trgujte dok ne dođem.’",
        it: "dicendo: “Fatele fruttare fino al mio ritorno”.",
        en: "and told them, ‘Engage in trade with these until I return.’",
      },
      {
        de: "Seine Bürger jedoch hassten ihn und schickten eine Gesandtschaft hinter ihm her",
        hr: "A njegovi ga građani mrzili te poslaše za njim poslanstvo",
        it: "Ma i suoi cittadini lo odiavano e mandarono dietro di lui una delegazione",
        en: "His fellow citizens, however, despised him and sent a delegation after him",
      },
      {
        de: "und ließen sagen: Wir wollen nicht, dass dieser Mann über uns König wird.",
        hr: "s porukom: ‘Nećemo da se ovaj zakralji nad nama.’«",
        it: "a dire: “Non vogliamo che costui venga a regnare su di noi”.",
        en: "to announce, ‘We do not want this man to be our king.’",
      },
      {
        de: "Und es geschah, als er die Königswürde empfangen hatte und zurückkehrte,",
        hr: "»Kad je on primio kraljevstvo i vratio se,",
        it: "Dopo aver ricevuto il titolo di re, egli ritornò",
        en: "But when he returned after obtaining the kingship,",
      },
      {
        de: "da ließ er die Diener, denen er das Geld gegeben hatte, zu sich rufen.",
        hr: "naredi da mu dozovu one sluge kojima je predao novac",
        it: "e fece chiamare quei servi a cui aveva consegnato il denaro,",
        en: "he had the servants called, to whom he had given the money,",
      },
      {
        de: "Er wollte sehen, welchen Gewinn sie bei ihren Geschäften erzielt hatten.",
        hr: "da sazna što su zaradili.«",
        it: "per sapere quanto ciascuno avesse guadagnato.",
        en: "to learn what they had gained by trading.",
      },
      {
        de: "Der erste kam und sagte: Herr, deine Mine hat zehn Minen eingebracht.",
        hr: "»Pristupi prvi i reče: ‘Gospodaru, tvoja mna donije deset mna.’",
        it: "Si presentò il primo e disse: “Signore, la tua moneta d'oro ne ha fruttate dieci”.",
        en: "The first came forward and said, ‘Sir, your gold coin has earned ten additional ones.’",
      },
      {
        de: "Da sagte der König zu ihm: Sehr gut, du bist ein guter Diener.",
        hr: "Reče mu: ‘Vàljaš, slugo dobri!",
        it: "Gli disse: “Bene, servo buono!",
        en: "He replied, ‘Well done, good servant!",
      },
      {
        de: "Weil du im Kleinsten zuverlässig warst, sollst du Herr über zehn Städte werden.",
        hr: "U najmanjem si bio vjeran, vladaj nad deset gradova!’",
        it: "Poiché ti sei mostrato fedele nel poco, ricevi il potere sopra dieci città”.",
        en: "You have been faithful in this very small matter; take charge of ten cities.’",
      },
      {
        de: "Der zweite kam und sagte: Herr, deine Mine hat fünf Minen eingebracht.",
        hr: "Dođe i drugi govoreći: ‘Mna je tvoja, gospodaru, donijela pet mna.’",
        it: "Poi si presentò il secondo e disse: “Signore, la tua moneta d'oro ne ha fruttate cinque”.",
        en: "Then the second came and reported, ‘Your gold coin, sir, has earned five more.’",
      },
      {
        de: "Zu ihm sagte der König: Du sollst über fünf Städte herrschen.",
        hr: "I tomu reče: ‘I ti budi nad pet gradova!’«",
        it: "Anche a questo disse: “Tu pure sarai a capo di cinque città”.",
        en: "And to this servant too he said, ‘You, take charge of five cities.’",
      },
      {
        de: "Nun kam ein anderer und sagte: Herr, siehe deine Mine.",
        hr: "»Treći, opet, dođe govoreći: ‘Gospodaru, evo ti tvoje mne.",
        it: "Venne poi anche un altro e disse: “Signore, ecco la tua moneta d'oro,",
        en: "Then the other servant came and said, ‘Sir, here is your gold coin;",
      },
      {
        de: "Ich habe sie in einem Schweißtuch aufbewahrt;",
        hr: "Držao sam je pohranjenu u rupcu.",
        it: "che ho tenuto nascosta in un fazzoletto;",
        en: "I kept it stored away in a handkerchief,",
      },
      {
        de: "denn ich hatte Angst vor dir, weil du ein strenger Mann bist:",
        hr: "Bojao sam te se jer si čovjek strog:",
        it: "avevo paura di te, che sei un uomo severo:",
        en: "for I was afraid of you, because you are a demanding person;",
      },
      {
        de: "Du hebst ab, was du nicht eingezahlt hast, und erntest, was du nicht gesät hast.",
        hr: "uzimaš što nisi pohranio, žanješ što nisi posijao.’«",
        it: "prendi quello che non hai messo in deposito e mieti quello che non hai seminato”.",
        en: "you take up what you did not lay down and you harvest what you did not plant.’",
      },
      {
        de: "Der König antwortete: Aus deinem eigenen Mund spreche ich dir das Urteil.",
        hr: "»Kaže mu: ‘Iz tvojih te usta sudim, zli slugo!",
        it: "Gli rispose: “Dalle tue stesse parole ti giudico, servo malvagio!",
        en: "He said to him, ‘With your own words I shall condemn you, you wicked servant.",
      },
      {
        de: "Du bist ein schlechter Diener. Du hast gewusst, dass ich ein strenger Mann bin?",
        hr: "Znao si da sam čovjek strog,",
        it: "Sapevi che sono un uomo severo,",
        en: "You knew I was a demanding person,",
      },
      {
        de: "Dass ich abhebe, was ich nicht eingezahlt habe, und ernte, was ich nicht gesät habe?",
        hr: "da uzimam što nisam pohranio i žanjem što nisam posijao?",
        it: "che prendo quello che non ho messo in deposito e mieto quello che non ho seminato:",
        en: "taking up what I did not lay down and harvesting what I did not plant;",
      },
      {
        de: "Warum hast du dann mein Geld nicht auf die Bank gebracht?",
        hr: "Zašto onda nisi uložio moj novac u novčarnicu?",
        it: "perché allora non hai consegnato il mio denaro a una banca?",
        en: "why did you not put my money in a bank?",
      },
      {
        de: "Dann hätte ich es bei der Rückkehr mit Zinsen abheben können.",
        hr: "Ja bih ga po povratku podigao s dobitkom.’",
        it: "Al mio ritorno l'avrei riscosso con gli interessi”.",
        en: "Then on my return I would have collected it with interest.’",
      },
      {
        de: "Und zu denen, die dabeistanden, sagte er:",
        hr: "Nato reče nazočnima:",
        it: "Disse poi ai presenti:",
        en: "And to those standing by he said,",
      },
      {
        de: "Nehmt ihm die Mine weg und gebt sie dem, der die zehn Minen hat!",
        hr: "‘Uzmite od njega mnu i dajte onomu koji ih ima deset.’",
        it: "“Toglietegli la moneta d'oro e datela a colui che ne ha dieci”.",
        en: "‘Take the gold coin from him and give it to the servant who has ten.’",
      },
      {
        de: "Sie sagten zu ihm: Herr, er hat doch schon zehn.",
        hr: "Rekoše mu: ‘Gospodaru, ta već ima deset mna!’",
        it: "Gli risposero: “Signore, ne ha già dieci!”.",
        en: "But they said to him, ‘Sir, he has ten gold coins.’",
      },
      {
        de: "Ich sage euch: Wer hat, dem wird gegeben werden;",
        hr: "‘Kažem vam: svakomu koji ima još će se dati,",
        it: "“Io vi dico: A chi ha, sarà dato;",
        en: "‘I tell you, to everyone who has, more will be given,",
      },
      {
        de: "wer aber nicht hat, dem wird auch noch weggenommen, was er hat.",
        hr: "a od onoga koji nema oduzet će se i ono što ima.’«",
        it: "invece a chi non ha, sarà tolto anche quello che ha”».",
        en: "but from the one who has not, even what he has will be taken away.’”",
      },
    ],
  },
};

/** The readings behind `live.reading` (first, gospel), per `readings.set`: the Carlo Acutis Mass or the test Mass. */
export const READING_SETS = {
  actual: { first: "isaiah", gospel: "gospel" },
  test: { first: "proverbs", gospel: "luke" },
} as const;
