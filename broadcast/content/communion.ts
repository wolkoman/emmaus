/**
 * Texts for the communion, while the stream shows only a b-roll image: the act
 * of spiritual communion (after St. Alphonsus Liguori) for viewers at home, and
 * a word of Carlo Acutis on the Eucharist. To be checked with the parish before
 * the Mass: the prayer exists in several versions in each language.
 */
import { READING_LANGS } from "./readings";

type Texts = Record<(typeof READING_LANGS)[number], string>;

export const COMMUNION: {
  prayer: { title: Texts; text: Texts };
  carlo: { quote: Texts; author: Texts };
} = {
  prayer: {
    title: {
      de: "Geistliche Kommunion",
      hr: "Duhovna pričest",
      it: "Comunione spirituale",
      en: "Spiritual Communion",
    },
    text: {
      de: "Mein Jesus, ich glaube, dass du im allerheiligsten Sakrament gegenwärtig bist. Ich liebe dich über alles und sehne mich danach, dich in meine Seele aufzunehmen. Da ich dich jetzt nicht sakramental empfangen kann, komm wenigstens geistigerweise in mein Herz. Ich umarme dich, als wärst du schon da, und vereinige mich ganz mit dir. Lass nicht zu, dass ich jemals von dir getrennt werde. Amen.",
      hr: "Isuse moj, vjerujem da si prisutan u Presvetom Sakramentu. Ljubim te iznad svega i želim te primiti u svoju dušu. Budući da te sada ne mogu primiti sakramentalno, dođi barem duhovno u moje srce. Grlim te kao da si već došao i potpuno se sjedinjujem s tobom. Ne dopusti da se ikada odvojim od tebe. Amen.",
      it: "Gesù mio, io credo che sei realmente presente nel Santissimo Sacramento. Ti amo sopra ogni cosa e ti desidero nell'anima mia. Poiché ora non posso riceverti sacramentalmente, vieni almeno spiritualmente nel mio cuore. Come già venuto, io ti abbraccio e tutto mi unisco a te; non permettere che mi abbia mai a separare da te. Amen.",
      en: "My Jesus, I believe that you are present in the Most Holy Sacrament. I love you above all things, and I desire to receive you into my soul. Since I cannot at this moment receive you sacramentally, come at least spiritually into my heart. I embrace you as if you were already there and unite myself wholly to you. Never permit me to be separated from you. Amen.",
    },
  },
  carlo: {
    quote: {
      de: "Die Eucharistie ist meine Autobahn in den Himmel.",
      hr: "Euharistija je moja autocesta za nebo.",
      it: "L'Eucaristia è la mia autostrada per il Cielo.",
      en: "The Eucharist is my highway to heaven.",
    },
    author: {
      de: "Hl. Carlo Acutis",
      hr: "Sveti Carlo Acutis",
      it: "San Carlo Acutis",
      en: "Saint Carlo Acutis",
    },
  },
};
