const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

const TEMPLATE_PATH = path.join(
  __dirname,
  "public",
  "mission-template.pdf"
);

const BOOKMAN_PATH = path.join(
  __dirname,
  "public",
  "fonts",
  "BOOKOS.TTF"
);

const GISHA_PATH = path.join(
  __dirname,
  "public",
  "fonts",
  "GISHA.TTF"
);

const OUTPUT_PATH = path.join(
  __dirname,
  "public",
  "mission-001-test.pdf"
);

const BASE_URL =
  "https://wedding-mission-next-omega.vercel.app/?mission=";

const missions = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "missions.json"),
    "utf8"
  )
);

/*
  צבעים
*/

const BURGUNDY = rgb(
  122 / 255,
  30 / 255,
  42 / 255
);

/*
  זהב של MISSION #
*/
const GOLD = rgb(
  196 / 255,
  161 / 255,
  103 / 255
);

const CREAM = rgb(
  253 / 255,
  249 / 255,
  238 / 255
);

function mm(value) {
  return value * 72 / 25.4;
}

async function createMission001() {
  const missionId = "001";
  const missionText = missions[missionId];

  if (!missionText) {
    throw new Error("Mission 001 not found in missions.json");
  }

  /*
    טוענים את תבנית ה-PDF
  */
  const templateBytes =
    fs.readFileSync(TEMPLATE_PATH);

  const pdfDoc =
    await PDFDocument.load(templateBytes);

  pdfDoc.registerFontkit(fontkit);

  /*
    פונטים
  */
  const bookmanBytes =
    fs.readFileSync(BOOKMAN_PATH);

  const gishaBytes =
    fs.readFileSync(GISHA_PATH);

  const bookmanFont =
    await pdfDoc.embedFont(
      bookmanBytes,
      { subset: true }
    );

  const gishaFont =
    await pdfDoc.embedFont(
      gishaBytes,
      { subset: true }
    );

  const page =
    pdfDoc.getPages()[0];

  const { width, height } =
    page.getSize();

  /*
    ==========================================
    1. מספר המשימה
    ==========================================
  */

  page.drawRectangle({
    x: mm(69),
    y: height - mm(63.5),
    width: mm(18),
    height: mm(8),
    color: CREAM
  });

  const numberText = "001";

  const numberSize = 19;

  page.drawText(numberText, {
    x: mm(69.5),
    y: height - mm(61.5),
    size: numberSize,
    font: bookmanFont,
    color: GOLD
  });

  /*
    ==========================================
    2. טקסט המשימה
    ==========================================
  */

  let missionFontSize = 15;

  const maxMissionWidth = mm(88);

  let missionWidth =
    gishaFont.widthOfTextAtSize(
      missionText,
      missionFontSize
    );

  /*
    מקטינים אוטומטית אם המשפט ארוך
  */
  while (
    missionWidth > maxMissionWidth &&
    missionFontSize > 11
  ) {
    missionFontSize -= 0.5;

    missionWidth =
      gishaFont.widthOfTextAtSize(
        missionText,
        missionFontSize
      );
  }

  /*
    ממרכזים את המשפט
  */
  const missionX =
    (width - missionWidth) / 2;

  page.drawText(missionText, {
    x: missionX,
    y: height - mm(86),
    size: missionFontSize,
    font: gishaFont,
    color: BURGUNDY
  });

  /*
    ==========================================
    3. QR
    ==========================================
  */

  const qrUrl =
    `${BASE_URL}${missionId}`;

  const qrBuffer =
    await QRCode.toBuffer(qrUrl, {
      type: "png",
      width: 1000,
      margin: 1,
      errorCorrectionLevel: "M",

      color: {
        dark: "#7A1E2AFF",
        light: "#00000000"
      }
    });

  const qrImage =
    await pdfDoc.embedPng(qrBuffer);

  const qrSize = mm(32);

  page.drawImage(qrImage, {
    x: (width - qrSize) / 2,
    y: height - mm(135),
    width: qrSize,
    height: qrSize
  });

  /*
    שמירה
  */

  const outputBytes =
    await pdfDoc.save();

  fs.writeFileSync(
    OUTPUT_PATH,
    outputBytes
  );

  console.log(
    "✓ Created public/mission-001-test.pdf"
  );
}

createMission001().catch((error) => {
  console.error(error);
  process.exit(1);
});
