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

const css = fs.readFileSync(
  path.join(__dirname, "cards.css"),
  "utf8"
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
    margin: 1,
    width: 700,
    color: {
      dark: "#512126",
      light: "#efe1c7",
    },
  });

  return `
<section class="mission-card">

  <div class="frame outer"></div>
  <div class="frame inner"></div>

  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>

  <div class="content">

    <div class="kicker">
      WEDDING MISSION
    </div>

    <div class="divider">
      <span></span>
    </div>

    <div class="names">
      ADI &amp; NITAY
    </div>

    <div class="date">
      11.03.2027
    </div>

    <div class="divider small">
      <span></span>
    </div>

    <div class="mission-number">
      MISSION #${missionId}
    </div>

    <div class="short-line"></div>

    <div class="label">
      המשימה שלכם:
    </div>

    <div class="mission-text">
      ${escapeHtml(missionText)}
    </div>

    <div class="qr-row">

      <div class="side-ornament"></div>

      <div class="qr-box">
        <img
          src="${qr}"
          alt="Mission ${missionId}"
        />
      </div>

      <div class="side-ornament right"></div>

    </div>

    <div class="scan-text">
      סרקו כדי להעלות את התמונה או הסרטון
    </div>

    <div class="divider footer-divider">
      <span></span>
    </div>

    <div class="footer">
      Keep the memory. Complete the mission.
    </div>

  </div>

</section>
`;
}

async function generate() {
  const cards = [];

  const ids = Object.keys(missions).sort();

  for (const id of ids) {
    console.log(`Creating mission ${id}`);
    cards.push(
      await createCard(id, missions[id])
    );
  }

  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <title>ADI & NITAY Wedding Missions</title>

  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
  >

  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
  >

  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+Hebrew:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap"
    rel="stylesheet"
  >

  <style>
    ${css}
  </style>

</head>

<body>

  ${cards.join("\n")}

</body>

</html>
`;

  const publicDir = path.join(__dirname, "public");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(
    path.join(publicDir, "all-cards.html"),
    html,
    "utf8"
  );

  console.log("");
  console.log(`✓ Created ${ids.length} cards`);
  console.log("✓ public/all-cards.html");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
