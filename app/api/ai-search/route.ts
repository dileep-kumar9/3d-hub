import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore malformed body
  }

  const prompt = body.prompt || "";
  const section = body.section || "general";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!prompt.trim()) {
    return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ query: prompt, isFallback: true });
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
                  text: `You are helping search YouTube for a streaming app. The user is browsing the "${section}" section and typed: "${prompt}".
Turn this into a short, effective YouTube search query (a few words) that will find relevant videos.
Respond with ONLY the search query text — no quotes, no explanation.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const optimizedQuery: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || prompt;

    return NextResponse.json({ query: optimizedQuery });
  } catch (err) {
    return NextResponse.json({ query: prompt, isFallback: true });
  }
}
