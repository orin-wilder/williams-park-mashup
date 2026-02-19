export default async (req) => {
    if (req.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
    }

    const { term1, term2 } = await req.json();

    const systemPrompt = `You are a park programming assistant for Williams Park in St. Petersburg, Florida — a diverse, historic downtown park serving families, seniors, young professionals, artists, and unhoused neighbors. A user has combined two concepts to generate a new park idea. Write a 2-3 sentence description of what this program or feature could look like in practice. Be specific, grounded, and locally relevant to St. Pete's culture. If either input is inappropriate, offensive, or irrelevant to a public park, respond only with the word REJECTED and nothing else. If an input is mildly off but salvageable, interpret it charitably and use a cleaned-up version in your description without flagging it.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
                  "Content-Type": "application/json",
                  "x-api-key": process.env.ANTHROPIC_API_KEY,
                  "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
                  model: "claude-sonnet-4-6",
                  max_tokens: 200,
                  system: systemPrompt,
                  messages: [{ role: "user", content: `Combine these two park concepts into one idea: "${term1}" + "${term2}"` }],
          }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() ?? "REJECTED";
    return new Response(JSON.stringify({ result: text }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
    });
};

export const config = { path: "/api/ideate" };
