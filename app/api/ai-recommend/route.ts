import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const recentTitles: string[] = Array.isArray(body.recentTitles) ? body.recentTitles.slice(0, 5) : [];
  const apiKey = process.env.GEMINI_API_KEY;

  if (recentTitles.length === 0) {
    return NextResponse.json({ query: null });
  }

  if (!apiKey) {
    return NextResponse.json({ query: recentTitles[0], isFallback: true });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `A user on a Telugu/Tollywood-focused streaming app recently watched these videos:
${recentTitles.map((t) => `- ${t}`).join("\n")}

Suggest ONE short YouTube search query (a few words) that would find similar content they'd likely enjoy next.
Respond with ONLY the search query text — no quotes, no explanation.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const query: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || recentTitles[0];

    return NextResponse.json({ query });
  } catch {
    return NextResponse.json({ query: recentTitles[0], isFallback: true });
  }
}
