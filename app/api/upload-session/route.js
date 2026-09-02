import { createDriveUploadSession } from "../../../lib/googleDrive";

export async function POST(request) {
  try {
    const body = await request.json();

    const missionId =
      String(body.mission_id || "").trim();

    const uploaderName =
      String(body.uploader_name || "")
        .trim()
        .slice(0, 80);

    const originalFilename =
      String(body.filename || "").trim();

    const mimeType =
      String(
        body.mime_type ||
        "application/octet-stream"
      );

    const fileSize =
      Number(body.file_size || 0);


    if (!missionId) {
      return Response.json(
        {
          success: false,
          message: "Missing mission_id",
        },
        {
          status: 400,
        }
      );
    }


    if (!originalFilename) {
      return Response.json(
        {
          success: false,
          message: "Missing filename",
        },
        {
          status: 400,
        }
      );
    }


    if (!fileSize || fileSize <= 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid file size",
        },
        {
          status: 400,
        }
      );
    }


    /*
      שם הקובץ ב-Google Drive

      לדוגמה:
      037__Dana__IMG_1234.jpg

      ואם לא כתבו שם:
      037__IMG_1234.jpg
    */

    const safeName =
      uploaderName
        ? `${missionId}__${uploaderName}__${originalFilename}`
        : `${missionId}__${originalFilename}`;


    const uploadUrl =
      await createDriveUploadSession({
        filename: safeName,
        mimeType,
        fileSize,
      });


    return Response.json({
      success: true,
      upload_url: uploadUrl,
    });

  } catch (error) {

    console.error(
      "Upload session error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Could not prepare upload",
      },
      {
        status: 500,
      }
    );
  }
}
