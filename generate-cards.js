const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const BASE_URL =
  "https://wedding-mission-next-omega.vercel.app/?mission=";

const missions = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "missions.json"),
    "utf8"
  )
);

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function createCard(missionId, missionText) {
  const url = `${BASE_URL}${missionId}`;

  const qr = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 700,
    color: {
      dark: "#351a1f",
      light: "#f4e5cb",
    },
  });

  return `
    <section class="mission-card">

      <div class="border border-outer"></div>
      <div class="border border-inner"></div>

      <div class="corner corner-tl">❦</div>
      <div class="corner corner-tr">❦</div>
      <div class="corner corner-bl">❦</div>
      <div class="corner corner-br">❦</div>

      <div class="card-content">

        <div class="top-title">
          WEDDING MISSION
        </div>

        <div class="ornament">
          <span></span>
          <i>◆</i>
          <span></span>
        </div>

        <div class="couple-name">
          ADI &amp; NITAY
        </div>

        <div class="wedding-date">
          11.03.2027
        </div>

        <div class="mission-number">
          MISSION #${missionId}
        </div>

        <div class="small-ornament">
          <span></span>
          <i>◆</i>
          <span></span>
        </div>

        <div class="mission-label">
          המשימה שלכם
        </div>

        <div class="mission-text">
          ${escapeHtml(missionText)}
        </div>

        <div class="qr-frame">
          <img
            src="${qr}"
            alt="QR למשימה ${missionId}"
          />
        </div>

        <div class="scan-text">
          סרקו כדי לפתוח את המשימה ולהעלות
          <br />
          <strong>את התמונה או הסרטון</strong>
        </div>

        <div class="bottom-ornament">
          <span></span>
          <i>◆</i>
          <span></span>
        </div>

        <div class="footer-text">
          Keep the memory. Complete the mission.
        </div>

      </div>
    </section>
  `;
}

async function generate() {
  const cards = [];

  const ids = Object.keys(missions).sort();

  for (const missionId of ids) {
    console.log(`Creating mission ${missionId}...`);

    const card = await createCard(
      missionId,
      missions[missionId]
    );

    cards.push(card);
  }

  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>
    ADI & NITAY — Wedding Missions
  </title>

  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
  />

  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
  />

  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+Hebrew:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap"
    rel="stylesheet"
  />

  <link
    rel="stylesheet"
    href="cards.css"
  />
</head>

<body>

  <main class="cards-container">
    ${cards.join("\n")}
  </main>

</body>

</html>
  `;

  fs.writeFileSync(
    path.join(__dirname, "all-cards.html"),
    html,
    "utf8"
  );

  console.log("");
  console.log("✓ Finished");
  console.log(
    `${ids.length} wedding mission cards created.`
  );
  console.log(
    "Open all-cards.html in your browser."
  );
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
