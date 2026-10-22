/**
 * Converts a Bible reading reference to a BibleServer URL
 * @param reading - Bible reference like "Jes 8,23b-9,3" or "1 Kor 2,1-5"
 * @returns BibleServer URL or empty string if reading is empty
 */
export function readingToBibleServerUrl(reading: string): string {
  if (!reading) return "";

  // Extract just the book and chapter (remove verse details)
  const match = reading.match(/^([^0-9]+\s*\d*)\s*(\d+)/);
  if (!match) return "";

  const bookAbbr = match[1].trim();
  const chapter = match[2];

  // Map common German abbreviations to BibleServer book names
  const bookMap: Record<string, string> = {
    "Gen": "1.Mose",
    "Ex": "2.Mose",
    "Lev": "3.Mose",
    "Num": "4.Mose",
    "Dtn": "5.Mose",
    "Jos": "Josua",
    "Ri": "Richter",
    "Rut": "Rut",
    "1 Sam": "1.Samuel",
    "2 Sam": "2.Samuel",
    "1 Kön": "1.Könige",
    "2 Kön": "2.Könige",
    "1 Chr": "1.Chronik",
    "2 Chr": "2.Chronik",
    "Esra": "Esra",
    "Neh": "Nehemia",
    "Tob": "Tobit",
    "Jdt": "Judit",
    "Est": "Ester",
    "1 Makk": "1.Makkabäer",
    "2 Makk": "2.Makkabäer",
    "Ijob": "Ijob",
    "Ps": "Psalm",
    "Spr": "Sprüche",
    "Koh": "Prediger",
    "Hld": "Hohelied",
    "Weish": "Weisheit",
    "Sir": "Sirach",
    "Jes": "Jesaja",
    "Jer": "Jeremia",
    "Klgl": "Klagelieder",
    "Bar": "Baruch",
    "Ez": "Hesekiel",
    "Dan": "Daniel",
    "Hos": "Hosea",
    "Joel": "Joel",
    "Am": "Amos",
    "Obd": "Obadja",
    "Jona": "Jona",
    "Mi": "Micha",
    "Nah": "Nahum",
    "Hab": "Habakuk",
    "Zef": "Zefanja",
    "Hag": "Haggai",
    "Sach": "Sacharja",
    "Mal": "Maleachi",
    "Mt": "Matthäus",
    "Mk": "Markus",
    "Lk": "Lukas",
    "Joh": "Johannes",
    "Apg": "Apostelgeschichte",
    "Röm": "Römer",
    "1 Kor": "1.Korinther",
    "2 Kor": "2.Korinther",
    "Gal": "Galater",
    "Eph": "Epheser",
    "Phil": "Philipper",
    "Kol": "Kolosser",
    "1 Thess": "1.Thessalonicher",
    "2 Thess": "2.Thessalonicher",
    "1 Tim": "1.Timotheus",
    "2 Tim": "2.Timotheus",
    "Tit": "Titus",
    "Phlm": "Philemon",
    "Hebr": "Hebräer",
    "Jak": "Jakobus",
    "1 Petr": "1.Petrus",
    "2 Petr": "2.Petrus",
    "1 Joh": "1.Johannes",
    "2 Joh": "2.Johannes",
    "3 Joh": "3.Johannes",
    "Jud": "Judas",
    "Offb": "Offenbarung",
  };

  const bookName = bookMap[bookAbbr] || bookAbbr;

  // URL encode the book name and format: /EU/BookName + chapter
  return `https://www.bibleserver.com/EU/${encodeURIComponent(bookName)}${chapter}`;
}
