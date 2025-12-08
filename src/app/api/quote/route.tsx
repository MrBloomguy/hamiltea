import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const res = await fetch(
      `https://api.0x.org/swap/permit2/quote?${searchParams}`,
      {
        headers: {
          "0x-api-key": process.env.ZEROX_API_KEY as string,
          "0x-version": "v2",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.text();
      console.error("0x API quote error:", res.status, errorData);
      return Response.json(
        { error: `0x API error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    console.log(
      "quote api",
      `https://api.0x.org/swap/permit2/quote?${searchParams}`
    );

    console.log("quote data", JSON.stringify(data, null, 2));

    return Response.json(data);
  } catch (error) {
    console.error("Quote API error:", error);
    return Response.json(
      { error: "Failed to fetch quote data" },
      { status: 500 }
    );
  }
}
