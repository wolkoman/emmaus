const config = {
  output: "standalone",
  cacheComponents: true,
  // Dev only (ignored in prod builds): allow accessing the dev server through
  // an ngrok tunnel, e.g. so a PDF render job can fetch a local print route.
  // Without this, Next blocks cross-origin requests to dev assets and the
  // page never hydrates (data-print-waiting persists, renders time out).
  allowedDevOrigins: ["*.ngrok-free.app"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  async redirects() {
    return [
      // The Wochenblatt was retired in favour of the Monatsblatt; old links
      // (incl. the Wochenmitteilungen-era ones) land there.
      {
        source: "/wochenblatt/instagram",
        destination: "/monatsblatt/instagram",
        permanent: true,
      },
      {
        source: "/(wochenblatt|wochenmitteilungen)/:path*",
        destination: "/monatsblatt",
        permanent: true,
      },
      // The project overview was replaced by the project sidebar.
      {
        source: "/redaktion/uebersicht",
        destination: "/redaktion",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/intern/login",
        permanent: true,
      },
      {
        source: "/zvonko2025",
        destination:
          "/artikel/lqc5uryuraf4768/im-gespraech-mit-pfarrer-zvonko-alles-ist-eine-gnade-gottes",
        permanent: true,
      },
      {
        source: "/(livestream|stream)",
        destination: "/carlo",
        permanent: true,
      },
      // The livestream page moved to the Carlo Acutis event page.
      {
        source: "/live/:lang",
        destination: "/carlo/:lang",
        permanent: false,
      },
      {
        source: "/ig",
        destination: "https://www.instagram.com/pfarreemmaus",
        permanent: true,
      },
      {
        source: "/intern/editor/article",
        has: [
          {
            type: "query",
            key: "articleId",
          },
        ],
        destination: "/redaktion/artikel/:articleId",
        permanent: true,
      },
    ];
  },
};
export default config;
