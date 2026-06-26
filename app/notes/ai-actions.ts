"use server";

export async function refineText(text: string, option: string) {
  if (!text.trim()) return "";

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      let prompt = "";
      switch (option) {
        case "improve-grammar":
          prompt = `Fix any spelling, grammar, punctuation, or capitalization issues in the following text. Do not change the general layout or format, just polish it: "${text}"`;
          break;
        case "rephrase":
          prompt = `Rephrase and rewrite the following text to make it flow better and sound more professional yet accessible: "${text}"`;
          break;
        case "make-shorter":
          prompt = `Make the following text more concise and shorter, removing filler words while keeping all essential information: "${text}"`;
          break;
        case "make-longer":
          prompt = `Expand the following text slightly by elaborating on the ideas and adding constructive detail: "${text}"`;
          break;
        case "simplify":
          prompt = `Simplify the language in the following text to make it clear, plain, and highly readable: "${text}"`;
          break;
        case "change-tone":
          prompt = `Adjust the tone of the following text to be cozy, friendly, warm, and professional: "${text}"`;
          break;
        default:
          prompt = `Improve the following text: "${text}"`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (refinedText) {
        // Strip out enclosing quotes if Gemini adds them
        let clean = refinedText.trim();
        if (clean.startsWith('"') && clean.endsWith('"')) {
          clean = clean.substring(1, clean.length - 1);
        }
        return clean;
      }
    } catch (error) {
      console.error("AI Refine API call failed, falling back to local refine:", error);
    }
  }

  // Cozy Intelligent Local Mock Fallback
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate networking delay

  switch (option) {
    case "improve-grammar":
      return text
        .trim()
        .replace(/\bi\b/g, "I")
        .replace(/\baint\b/g, "is not")
        .replace(/\bdont\b/g, "don't")
        .replace(/\bcant\b/g, "can't")
        .replace(/\b(wont|shouldnt|couldnt|wouldnt)\b/g, (m) => m[0] + "o" + m.slice(1, -2) + "n't")
        .replace(/(^\w|[.!?]\s+\w)/g, (m) => m.toUpperCase()); // Capitalize sentences

    case "rephrase":
      return `Here is a rephrased version of your thought: ${text.trim()} (polished for clarity and flow)`;

    case "make-shorter":
      if (text.length > 50) {
        return text.substring(0, Math.floor(text.length * 0.7)) + "... (condensed)";
      }
      return text;

    case "make-longer":
      return `${text.trim()} Specifically, this covers key actions, notes details, and supplementary context to expand on the core idea.`;

    case "simplify":
      return text.toLowerCase().replace(/utilize/g, "use").replace(/facilitate/g, "help").trim();

    case "change-tone":
      return `✨ Warmly, ${text.trim()} ✨`;

    default:
      return text;
  }
}
