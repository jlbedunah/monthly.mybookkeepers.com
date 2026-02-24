import { NextResponse } from "next/server";

export async function GET() {
  const clientKey = process.env.AUTHORIZE_NET_CLIENT_KEY;
  const apiLoginID = process.env.AUTHORIZE_NET_LOGIN_ID;

  if (!clientKey || !apiLoginID) {
    return NextResponse.json(
      {
        error: "Authorize.net credentials not configured",
        hasClientKey: !!clientKey,
        hasLoginID: !!apiLoginID,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    clientKey: clientKey.trim(),
    apiLoginID: apiLoginID.trim(),
  });
}
