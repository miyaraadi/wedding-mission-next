import missions from "../../../../missions.json";

export async function GET(request, context) {
  const { id } = await context.params;

  const missionTitle = missions[id];

  if (!missionTitle) {
    return Response.json(
      {
        success: false,
        message: "Mission not found",
      },
      {
        status: 404,
      }
    );
  }

  return Response.json({
    success: true,
    mission_id: id,
    mission_title: missionTitle,
  });
}
