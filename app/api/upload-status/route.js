export async function POST(request) {
  try {
    const body = await request.json();

    const uploadUrl = String(body.upload_url || "");
    const fileSize = Number(body.file_size || 0);

    if (
      !uploadUrl.startsWith("https://www.googleapis.com/") ||
      !fileSize ||
      fileSize <= 0
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid upload information",
        },
        {
          status: 400,
        }
      );
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes */${fileSize}`,
      },
    });

    if (response.status === 200 || response.status === 201) {
      return Response.json({
        success: true,
        complete: true,
      });
    }

    if (response.status === 308) {
      return Response.json({
        success: true,
        complete: false,
      });
    }

    return Response.json(
      {
        success: false,
        complete: false,
        google_status: response.status,
      },
      {
        status: 502,
      }
    );
  } catch (error) {
    console.error("Upload status error:", error);

    return Response.json(
      {
        success: false,
        complete: false,
      },
      {
        status: 500,
      }
    );
  }
}
