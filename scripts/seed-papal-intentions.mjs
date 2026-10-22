// Seed the papal_intentions collection (Gebetsanliegen des Papstes).
// German texts as provided from the official 2026 list (July–December).
// June is omitted: no German text provided (and already in the past).
//
// Local:  PB_URL=http://localhost:8090 PB_EMAIL=admin@emmaus.local PB_PASS=devpassword node scripts/seed-papal-intentions.mjs
// Prod:   bun pb:prod:tunnel   (separate terminal), then
//         PB_URL=http://localhost:8091 PB_EMAIL=... PB_PASS=... node scripts/seed-papal-intentions.mjs
// (Prod requires the papal_intentions migration to be deployed first.)

const intentions = {
  "2026-07": {
    title: "Für den Respekt des menschlichen Lebens",
    text: "Wir beten um Respekt und die Verteidigung des menschlichen Lebens in jedem seiner Abschnitte, indem es als Gabe Gottes angesehen wird.",
  },
  "2026-08": {
    title: "Für die Evangelisierung in den Städten",
    text: "Wir beten, dass es uns gelingt, in den großen Städten, die oft durch Anonymität und Einsamkeit gekennzeichnet sind, neue Formen zu finden, das Evangelium zu verkünden, und kreative Wege zur Gemeinschaftsbildung zu entdecken.",
  },
  "2026-09": {
    title: "Für die Sorge um Wasser",
    text: "Wir beten um eine gerechte und nachhaltige Verwaltung des Wassers, einer überlebenswichtigen Ressource, so dass alle in gleicher Weise Zugang dazu haben.",
  },
  "2026-10": {
    title: "Für die Pastoral der mentalen Gesundheit",
    text: "Wir beten, dass sich die Pastoral der mentalen Gesundheit in der ganzen Kirche integriert, so dass sie zur Überwindung der Stigmatisierung und der Diskriminierung von Personen mit mentalen Erkrankungen hilft.",
  },
  "2026-11": {
    title: "Für den rechten Gebrauch des Reichtums",
    text: "Wir beten um einen rechten Gebrauch des Reichtums, der nicht der Versuchung des Egoismus erliegt und sich immer in den Dienst des Gemeinwohls und der Solidarität mit denen stellt, die weniger haben.",
  },
  "2026-12": {
    title: "Für die Familien mit nur einem Elternteil",
    text: "Wir beten für die Familien, die die Erfahrung des Fehlens einer Mutter oder eines Vaters machen, dass sie in der Kirche Unterstützung und Begleitung finden, und im Glauben Hilfe und Kraft in schwierigen Zeiten.",
  },
};

const base = process.env.PB_URL,
  email = process.env.PB_EMAIL,
  pass = process.env.PB_PASS;
if (!base || !email || !pass) {
  console.error("Set PB_URL, PB_EMAIL, PB_PASS (see header comment).");
  process.exit(2);
}

const { token } = await fetch(
  base + "/api/collections/_superusers/auth-with-password",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: pass }),
  },
).then((r) => r.json());

for (const [month, { title, text }] of Object.entries(intentions)) {
  const list = await fetch(
    base +
      "/api/collections/papal_intentions/records?filter=" +
      encodeURIComponent(`month = "${month}"`),
    { headers: { Authorization: token } },
  ).then((r) => r.json());
  const existing = list.items?.[0];
  const res = existing
    ? await fetch(
        base + "/api/collections/papal_intentions/records/" + existing.id,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: token },
          body: JSON.stringify({ title, text }),
        },
      )
    : await fetch(base + "/api/collections/papal_intentions/records", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ month, title, text }),
      });
  console.log(month, existing ? "updated" : "created", res.status);
}
