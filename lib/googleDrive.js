import { google } from "googleapis";

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }

  if (!clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  }

  if (!refreshToken) {
    throw new Error("Missing GOOGLE_REFRESH_TOKEN");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export async function createDriveUploadSession({
  filename,
  mimeType,
  fileSize,
}) {
  const folderId =
    process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error(
      "Missing GOOGLE_DRIVE_FOLDER_ID"
    );
  }

  const auth = getOAuthClient();

  const accessTokenResponse =
    await auth.getAccessToken();

  const accessToken =
    typeof accessTokenResponse === "string"
      ? accessTokenResponse
      : accessTokenResponse?.token;

  if (!accessToken) {
    throw new Error(
      "Could not get Google access token"
    );
  }

  const metadata = {
    name: filename,
    parents: [folderId],
  };

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,mimeType,size,webViewLink",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json; charset=UTF-8",

        "X-Upload-Content-Type":
          mimeType ||
          "application/octet-stream",

        "X-Upload-Content-Length":
          String(fileSize),
      },

      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "Google Drive session error:",
      response.status,
      errorText
    );

    throw new Error(
      "Could not create Google Drive upload session"
    );
  }

  const uploadUrl =
    response.headers.get("location");

  if (!uploadUrl) {
    throw new Error(
      "Google Drive did not return an upload URL"
    );
  }

  return uploadUrl;
}
