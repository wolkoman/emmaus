const photo = (folder: string, image: string) =>
  `https://api.emmaus.wien/files/folder_${folder}/full/img_${image}.jpg`;

export const PHOTOS = {
  church: photo("6a21c02de166f1.87502911", "6a21c04e4201c0.84571712"),
  congregation: photo("6a21c02de166f1.87502911", "6a21c0694ec445.40677666"),
  altar: photo("6a21c02de166f1.87502911", "6a21c05f4d8613.26538755"),
};

export const SETTLEMENT_IMAGES = {
  brickworks: {
    src: "/geschichte/ziegelei-1815.jpg",
    caption: "Ziegelei auf dem Wienerberg um 1815",
    source: "https://commons.wikimedia.org/wiki/File:Wienerberg-um-1815.jpg",
  },
  recreation: {
    src: "/geschichte/erholungsgebiet.jpg",
    caption: "Erholungsgebiet Wienerberg, Blick nach Süden",
    source:
      "https://commons.wikimedia.org/wiki/File:Ergolungsgebiet_Wienerberg_Blick_Richtung_S%C3%BCden.jpg",
  },
};

export const SETTLEMENT = [
  "Unser Pfarrgebiet liegt auf dem ehemaligen Gelände der Wienerberger Ziegelwerke. 1775 ließ Maria Theresia hier einen Ziegelofen errichten, ab 1820 baute Alois Miesbach ihn zu einem Großbetrieb aus. Unter seinem Neffen Heinrich Drasche wurde die Ziegelfabrik zur größten Europas: 1862 produzierte sie 130 Millionen Ziegel, unter anderem für die Ringstraße und das Arsenal. Rund 10.000 Menschen arbeiteten hier.",
  "Die Arbeitsbedingungen der Ziegelarbeiter waren hart. 1888 machte Victor Adler die unhaltbaren Zustände öffentlich, 1895 folgte der erste erfolgreiche Streik.",
  "In den 1960er Jahren wurden die Ziegelwerke geschlossen, weil sich der Lehmabbau nicht mehr lohnte. Aus den ehemaligen Lehmgruben wurden die Teiche des Erholungsgebiets Wienerberg, das heute 117 Hektar umfasst und seit 1995 unter Schutz steht.",
  "Für die Wohnsiedlung am Südhang wurde 1978 ein Wettbewerb ausgeschrieben, den 1980 Otto Häuselmayer gewann. Zwischen 1984 und 1996 entstanden in drei Etappen rund 2.000 Wohnungen in einer autofreien Siedlung. In ihrer Mitte liegt der Tesarekplatz mit der Volksschule von Gustav Peichl, dem Kindergarten von Heinz Tesar, dem Wohnbau mit Geschäften von Helmut Wimmer und unserer Kirche.",
];

export const CHURCH = [
  "Als Gesamtplaner der Siedlung sah Otto Häuselmayer auf Wunsch der Erzdiözese Wien auch einen Bauplatz für eine Kirche vor. Zwischen 1990 und 1992 entstand nach seinen Plänen die Kirche mit Pfarrhof.",
  "Außen ist sie ein freistehender, weißer Rechteckbau. Unter dem gewölbten Dach umläuft ein Band aus Oberlichten den ganzen Bau und bringt Tageslicht in den Raum. Neben dem Eingang steht der niedrige Glockenturm, eine transparente Stahlkonstruktion.",
  "Innen trägt ein filigranes Stahltragwerk mit dreigliedrigen Stützen, entwickelt mit dem Statiker Wolfdietrich Ziesel, ein hölzernes Tonnendach und gliedert den Raum in drei Schiffe. Die Bänke stehen im Halbkreis um den Altar, der weit in den Raum hineinreicht. Eine verschiebbare Wand trennt bei Bedarf die Werktagskapelle ab.",
  "Ein Pfeiler steht auf einem historischen Holzpfahl aus der Zeit der Ziegelwerke, eine Erinnerung an die Geschichte des Wienerbergs.",
];

export const SOURCES = [
  {
    name: "Wien Geschichte Wiki: Emmaus am Wienerberg",
    url: "https://www.geschichtewiki.wien.gv.at/Emmaus_am_Wienerberg_(Pfarre)",
  },
  {
    name: "Wien Geschichte Wiki: Wienerberger Ziegelfabrik",
    url: "https://www.geschichtewiki.wien.gv.at/Wienerberger_Ziegelfabrik",
  },
  {
    name: "ÖGFA: Siedlung Wienerberggründe",
    url: "https://oegfa.at/archiv/jubilaeumsbauvisiten-1965-2005/jubilaeumsbauvisite-13-siedlung-wienerberggruende-1978",
  },
  {
    name: "Inge Scheidl: Emmauskirche",
    url: "https://www.inge-scheidl.at/gebaeudegalerie/sakralbauten-in-wien/8-15/10-tesarekplatz-emmauskirche",
  },
  {
    name: "Otto Häuselmayer: Kirche Emmaus am Wienerberg",
    url: "https://www.haeuselmayer.at/planungen-und-realisierungen/sakralbau/kirche-emmaus-am-wienerberg-wien-10",
  },
  {
    name: "Wikipedia: Wienerberg",
    url: "https://de.wikipedia.org/wiki/Wienerberg",
  },
];

export const EVENTS = [
  {
    date: "1989",
    text: "Am 1. Jänner 1989 wurde die Teilgemeinde Wienerfeld-West gegründet, die heute das Pfarrgebiet der Pfarre Emmaus umfasst. Einige Monate später, am 1. Juli 1989, wurde die Pfarrexpositur „Emmaus am Wienerberg“ als Expositur der Pfarre Salvator am Wienerfeld errichtet. Der erste Expositus war Mag. Joseph Debono (1. Juli 1989 bis 31. August 1990).",
  },
  {
    date: "1990",
    text: "Mit dem 1. September 1990 wurde Mag. Peter Lumbe zum Expositus der Pfarre ernannt.",
  },
  {
    date: "1992",
    text: "Im Jänner 1992 wurde die Pfarrkirche am Tesarekplatz eingeweiht.",
  },
  {
    date: "1997",
    text: "Mit Wirksamkeit vom 20. April 1997 wurde die Pfarrexpositur „Emmaus am Wienerberg“ zur Pfarre erhoben, gleichzeitig wurde Mag. Peter Lumbe zum Moderator ernannt.",
  },
  {
    date: "2007",
    text: "Mag. Peter Lumbe übte seine Funktion bis zu seinem Tod im Jahr 2007 aus. Daraufhin wirkte ein Jahr lang Mons. Dr. Petrus Bsteh als Provisor.",
  },
  {
    date: "2008",
    text: "Im Jahr 2008 übernahm Mag. Christoph Pfann die Aufgabe des Pfarrmoderators und war in dieser Funktion bis zum 31. August 2015 tätig.",
  },
  {
    date: "2015",
    text: "Mit 1. September 2015 wurde Lic. mr. sc. Zvonko Brezovski mag. theol. der Moderator der Pfarre. Am 29. November 2015 wechselte die Pfarre vom Stadtdekanat 10 ins Stadtdekanat 23.",
  },
  {
    date: "2020",
    text: "Mit dem Auftrag, die drei Pfarren Emmaus am Wienerberg, Inzersdorf und Inzersdorf-Neustift zusammenzuführen, wurde Dr. Zvonko Brezovski am 13. September 2020 zum Pfarrer der drei Pfarren erhoben.",
  },
  {
    date: "2024",
    text: "Seit 1. Juli 2024 ist Pfarrer Brezovski ausschließlich Pfarrer der Pfarre Emmaus am Wienerberg. Die Pfarren Inzersdorf und Inzersdorf-Neustift gehen seither eigene Wege.",
  },
  {
    date: "2026",
    text: "Ab Sommer 2026 bilden wir einen Entwicklungsraum mit der Pfarre Christus am Wienerberg und ihren Teilgemeinden Zu den hl. Aposteln, Zum hl. Franz von Sales und Salvator am Wienerfeld.",
  },
];

/** Lk 24,13-35 as previously published on the site (Einheitsübersetzung 1980). */
export const EMMAUS_PASSAGE = [
  "Am gleichen Tag waren zwei von den Jüngern auf dem Weg in ein Dorf namens Emmaus, das sechzig Stadien von Jerusalem entfernt ist. Sie sprachen miteinander über all das, was sich ereignet hatte. Während sie redeten und ihre Gedanken austauschten, kam Jesus hinzu und ging mit ihnen. Doch sie waren wie mit Blindheit geschlagen, so daß sie ihn nicht erkannten. Er fragte sie: Was sind das für Dinge, über die ihr auf eurem Weg miteinander redet? Da blieben sie traurig stehen, und der eine von ihnen - er hieß Kleopas - antwortete ihm: Bist du so fremd in Jerusalem, daß du als einziger nicht weißt, was in diesen Tagen dort geschehen ist? Er fragte sie: Was denn? Sie antworteten ihm: Das mit Jesus aus Nazaret. Er war ein Prophet, mächtig in Wort und Tat vor Gott und dem ganzen Volk. Doch unsere Hohenpriester und Führer haben ihn zum Tod verurteilen und ans Kreuz schlagen lassen. Wir aber hatten gehofft, daß er der sei, der Israel erlösen werde. Und dazu ist heute schon der dritte Tag, seitdem das alles geschehen ist. Aber nicht nur das: Auch einige Frauen aus unserem Kreis haben uns in große Aufregung versetzt. Sie waren in der Frühe beim Grab, fanden aber seinen Leichnam nicht. Als sie zurückkamen, erzählten sie, es seien ihnen Engel erschienen und hätten gesagt, er lebe. Einige von uns gingen dann zum Grab und fanden alles so, wie die Frauen gesagt hatten; ihn selbst aber sahen sie nicht. Da sagte er zu ihnen: Begreift ihr denn nicht? Wie schwer fällt es euch, alles zu glauben, was die Propheten gesagt haben. Mußte nicht der Messias all das erleiden, um so in seine Herrlichkeit zu gelangen? Und er legte ihnen dar, ausgehend von Mose und allen Propheten, was in der gesamten Schrift über ihn geschrieben steht.",
  "So erreichten sie das Dorf, zu dem sie unterwegs waren. Jesus tat, als wolle er weitergehen, aber sie drängten ihn und sagten: Bleib doch bei uns; denn es wird bald Abend, der Tag hat sich schon geneigt. Da ging er mit hinein, um bei ihnen zu bleiben. Und als er mit ihnen bei Tisch war, nahm er das Brot, sprach den Lobpreis, brach das Brot und gab es ihnen. Da gingen ihnen die Augen auf, und sie erkannten ihn; dann sahen sie ihn nicht mehr. Und sie sagten zueinander: Brannte uns nicht das Herz in der Brust, als er unterwegs mit uns redete und uns den Sinn der Schrift erschloß?",
  "Noch in derselben Stunde brachen sie auf und kehrten nach Jerusalem zurück, und sie fanden die Elf und die anderen Jünger versammelt. Diese sagten: Der Herr ist wirklich auferstanden und ist dem Simon erschienen. Da erzählten auch sie, was sie unterwegs erlebt und wie sie ihn erkannt hatten, als er das Brot brach.",
];
