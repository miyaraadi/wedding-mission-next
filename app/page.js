"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [missionId, setMissionId] = useState("");
  const [missionText, setMissionText] = useState("טוענים את המשימה...");
  const [guestName, setGuestName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [statusText, setStatusText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [success, setSuccess] = useState(false);

  const ADI_PHONE = "972543330598";
  const NITAY_PHONE = "972523357812";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("mission");

    if (!id) {
      setMissionText(
        "לא נמצא קוד משימה. אנא סרקו שוב את קוד ה-QR שעל הכרטיס."
      );
      return;
    }

    setMissionId(id);

    fetch(`/api/mission/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Mission not found");
        return res.json();
      })
      .then((data) => {
        setMissionText(data.mission_title);
      })
      .catch(() => {
        setMissionText("המשימה לא נמצאה. בדקו את הקישור ונסו שוב.");
      });
  }, []);

  const whatsappMessage = useMemo(() => {
    let message =
      `היי ❤️ לא הצלחתי להעלות דרך האתר.\n` +
      `אני שולח/ת כאן את התמונות או הסרטונים של משימה #${missionId}.`;

    if (guestName.trim()) {
      message += `\nהשם שלי: ${guestName.trim()}`;
    }

    return encodeURIComponent(message);
  }, [guestName, missionId]);

  function isSameFile(a, b) {
    return (
      a.name === b.name &&
      a.size === b.size &&
      a.lastModified === b.lastModified
    );
  }

  function addFiles(fileList) {
    const newFiles = Array.from(fileList || []);

    if (!newFiles.length) return;

    setSelectedFiles((current) => {
      const updated = [...current];

      newFiles.forEach((file) => {
        const exists = updated.some((existingFile) =>
          isSameFile(existingFile, file)
        );

        if (!exists) {
          updated.push(file);
        }
      });

      return updated;
    });

    setStatusText("");
  }

  function removeFile(index) {
    setSelectedFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  async function createUploadSession(file) {
    const response = await fetch("/api/upload-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mission_id: missionId,
        uploader_name: guestName.trim(),
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
      }),
    });

    let data = {};

    try {
      data = await response.json();
    } catch {}

    if (!response.ok || !data.success || !data.upload_url) {
      throw new Error(
        data.message || "לא הצלחנו להכין את הקובץ להעלאה."
      );
    }

    return data.upload_url;
  }

async function checkUploadStatus(uploadUrl, fileSize) {
  try {
    const response = await fetch("/api/upload-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        upload_url: uploadUrl,
        file_size: fileSize,
      }),
    });

    const data = await response.json();

    return (
      response.ok &&
      data.success === true &&
      data.complete === true
    );
  } catch (error) {
    console.error("Could not verify upload:", error);
    return false;
  }
}

async function uploadFileDirectlyToDrive(file, uploadUrl) {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });

    if (response.status === 200 || response.status === 201) {
      return true;
    }

    const complete = await checkUploadStatus(
      uploadUrl,
      file.size
    );

    if (complete) {
      return true;
    }

    throw new Error(`העלאת ${file.name} נכשלה.`);
  } catch (error) {
    /*
      ייתכן שהקובץ הגיע ל-Google Drive,
      אבל הדפדפן לא הורשה לקרוא את תשובת Google.
      לכן מוודאים מול Google דרך השרת לפני
      שמציגים הודעת כישלון.
    */

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    const complete = await checkUploadStatus(
      uploadUrl,
      file.size
    );

    if (complete) {
      return true;
    }

    console.error("Direct Drive upload error:", error);

    throw new Error(`העלאת ${file.name} נכשלה.`);
  }
}

  async function handleUpload() {
    if (!selectedFiles.length) {
      setStatusText("בחרו קודם תמונה או סרטון.");
      return;
    }

    setUploading(true);
    setStatusText("");

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        setUploadProgress(
          selectedFiles.length === 1
            ? "מעלים את הזיכרון שלכם…"
            : `מעלים קובץ ${i + 1} מתוך ${selectedFiles.length}…`
        );

        const uploadUrl =
          await createUploadSession(file);

        await uploadFileDirectlyToDrive(
          file,
          uploadUrl
        );
      }

      setSuccess(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (error) {
      console.error(error);

      setStatusText(
        error.message ||
          "ההעלאה נכשלה. אפשר גם לשלוח לנו בוואטסאפ."
      );

    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }

  if (success) {
    return (
      <div className="page">
        <header className="hero">
          <div className="small-title">WEDDING MISSION</div>

          <h1>
            ADI <span>&</span> NITAY
          </h1>

          <div className="date">11.03.2027</div>
        </header>

        <main>
          <section className="mission-card success-card">
            <div className="success-mark">✓</div>

            <h2>המשימה הושלמה</h2>

            <p>
              תודה ששמרתם איתנו עוד זיכרון מהחתונה
            </p>

            <div className="success-names">
              ADI & NITAY
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="small-title">
          WEDDING MISSION
        </div>

        <h1>
          ADI <span>&</span> NITAY
        </h1>

        <div className="date">
          11.03.2027
        </div>
      </header>

      <main>
        <section className="mission-card">
          <div className="mission-head">
            <div className="mission-label">
              המשימה שלכם
            </div>

            <div className="mission-number">
              {missionId ? `#${missionId}` : ""}
            </div>
          </div>

          <div className="mission-text">
            {missionText}
          </div>

          <div className="name-area">
            <label htmlFor="guestName">
              השם שלכם
              <span>לא חובה</span>
            </label>

            <input
              id="guestName"
              type="text"
              maxLength={80}
              placeholder="איך נדע מי שלח?"
              value={guestName}
              onChange={(e) =>
                setGuestName(e.target.value)
              }
              disabled={uploading}
            />
          </div>

          <div className="upload-title">
            הוסיפו תמונה או סרטון
          </div>

          <div className="upload-buttons">
            <label className="upload-btn burgundy">
              <strong>
                צילום עכשיו
              </strong>

              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                multiple
                hidden
                disabled={uploading}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            <label className="upload-btn gold">
              <strong>
                בחירה מהגלריה
              </strong>

              <input
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                disabled={uploading}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-files-area">
              <div className="selected-files-header">
                <strong>
                  הקבצים שבחרתם
                </strong>

                <span>
                  {selectedFiles.length}
                </span>
              </div>

              <div className="selected-files-grid">
                {selectedFiles.map((file, index) => (
                  <FilePreview
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    onRemove={() =>
                      removeFile(index)
                    }
                  />
                ))}
              </div>

              <div className="add-more-text">
                אפשר להוסיף עוד תמונות או סרטונים
              </div>
            </div>
          )}

          {selectedFiles.length > 0 &&
            !uploading && (
              <button
                type="button"
                className="final-upload"
                onClick={handleUpload}
              >
                {selectedFiles.length === 1
                  ? "העלאת הקובץ"
                  : `העלאת ${selectedFiles.length} קבצים`}
              </button>
            )}

          {uploading && (
            <div className="loading-box">
              <div className="loader"></div>

              <strong>
                {uploadProgress}
              </strong>

              <span>
                אל תסגרו את החלון
              </span>
            </div>
          )}

          {statusText && (
            <div className="status-text">
              {statusText}
            </div>
          )}

          <div className="whatsapp">
            <div className="whatsapp-title">
              לא עובד לכם? שלחו לנו בוואטסאפ
            </div>

            <div className="whatsapp-buttons">
              <a
                href={`https://wa.me/${ADI_PHONE}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>עדי</strong>
                <span>054-333-0598</span>
              </a>

              <a
                href={`https://wa.me/${NITAY_PHONE}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>נתאי</strong>
                <span>052-335-7812</span>
              </a>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

function FilePreview({
  file,
  onRemove,
}) {
  const [url, setUrl] =
    useState("");

  useEffect(() => {
    const objectUrl =
      URL.createObjectURL(file);

    setUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [file]);

  return (
    <div className="file-preview">

      {file.type.startsWith("image/") &&
        url && (
          <img
            src={url}
            alt={file.name}
          />
        )}

      {file.type.startsWith("video/") &&
        url && (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
          />
        )}

      <button
        type="button"
        className="file-remove"
        onClick={onRemove}
        aria-label={`הסרת ${file.name}`}
      >
        ×
      </button>

    </div>
  );
}
