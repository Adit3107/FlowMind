"use server";

export async function generateDiagramPrompt(prompt: string, type: string) {
  if (!prompt.trim()) return null;

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const systemInstructions = `You are an automated Excalidraw whiteboard diagram generator.
Given a user's prompt, generate a structured, logically laid-out diagram representing their request.
You MUST output ONLY a valid JSON object matching the schema below. Do not wrap the JSON in markdown code blocks, do not use backticks, and do not provide explanations.

JSON SCHEMA:
{
  "nodes": [
    {
      "id": "string (unique)",
      "label": "string (text to show)",
      "type": "rectangle" | "ellipse" | "diamond" | "sticky",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "color": "yellow" | "blue" | "green" | "red" | "orange" | "purple"
    }
  ],
  "edges": [
    {
      "from": "string (node id)",
      "to": "string (node id)",
      "label": "string (optional edge text)"
    }
  ]
}

Positioning & Alignment rules:
1. "flowchart": Lay out items vertically or horizontally with clear, readable spacing (e.g., y increments of 150px). Use "ellipse" for start/end, "diamond" for decision checks, and "rectangle" for steps.
2. "mindmap": Place the core concept in the center (e.g., x: 500, y: 500) and radiate sub-ideas outwards in different directions (e.g., left, right, top-right, bottom-left) with lines connecting them.
3. "system": Lay out nodes horizontally (Client on left, Gateway/Server in center, Database/Caching on right).
4. "journey": Lay out steps horizontally from left to right (e.g., x increments of 200px) representing user stages.
5. "process": Linear horizontal or vertical flow.

Make sure node widths are sufficient to fit the labels (typically 120px to 200px). Ensure nodes do not overlap.`;

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
                    text: `${systemInstructions}\n\nUser Prompt: "${prompt}"\nDiagram Type: "${type}"`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        let clean = rawText.trim();
        // Remove markdown wrappers if any exist
        if (clean.includes("```json")) {
          clean = clean.split("```json")[1].split("```")[0].trim();
        } else if (clean.includes("```")) {
          clean = clean.split("```")[1].split("```")[0].trim();
        }
        return JSON.parse(clean);
      }
    } catch (e) {
      console.error("AI Diagram generation failed, falling back to local layout:", e);
    }
  }

  // Local Rule-Based Mock Fallback Templates
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay

  const cleanPrompt = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;

  if (type === "mindmap") {
    return {
      nodes: [
        { id: "core", label: cleanPrompt || "Main Topic", type: "rectangle", x: 500, y: 500, width: 180, height: 60, color: "blue" },
        { id: "sub1", label: "Idea A", type: "sticky", x: 280, y: 400, width: 100, height: 100, color: "yellow" },
        { id: "sub2", label: "Idea B", type: "sticky", x: 720, y: 400, width: 100, height: 100, color: "green" },
        { id: "sub3", label: "Idea C", type: "sticky", x: 280, y: 600, width: 100, height: 100, color: "purple" },
        { id: "sub4", label: "Idea D", type: "sticky", x: 720, y: 600, width: 100, height: 100, color: "orange" },
      ],
      edges: [
        { from: "core", to: "sub1", label: "" },
        { from: "core", to: "sub2", label: "" },
        { from: "core", to: "sub3", label: "" },
        { from: "core", to: "sub4", label: "" },
      ],
    };
  }

  if (type === "system") {
    return {
      nodes: [
        { id: "client", label: "Web/Mobile App", type: "rectangle", x: 100, y: 400, width: 150, height: 80, color: "blue" },
        { id: "server", label: "App Server / API", type: "rectangle", x: 380, y: 400, width: 160, height: 80, color: "green" },
        { id: "db", label: "Postgres Database", type: "ellipse", x: 670, y: 400, width: 150, height: 80, color: "purple" },
      ],
      edges: [
        { from: "client", to: "server", label: "HTTP Request" },
        { from: "server", to: "db", label: "SQL Query" },
      ],
    };
  }

  if (type === "journey") {
    return {
      nodes: [
        { id: "step1", label: "1. Discover app", type: "sticky", x: 100, y: 400, width: 120, height: 120, color: "yellow" },
        { id: "step2", label: "2. Sign up", type: "sticky", x: 320, y: 400, width: 120, height: 120, color: "blue" },
        { id: "step3", label: "3. Onboarding", type: "sticky", x: 540, y: 400, width: 120, height: 120, color: "green" },
        { id: "step4", label: "4. Create notes", type: "sticky", x: 760, y: 400, width: 120, height: 120, color: "purple" },
      ],
      edges: [
        { from: "step1", to: "step2", label: "" },
        { from: "step2", to: "step3", label: "" },
        { from: "step3", to: "step4", label: "" },
      ],
    };
  }

  // Default Flowchart / Process linear flow fallback
  return {
    nodes: [
      { id: "start", label: "Start", type: "ellipse", x: 300, y: 100, width: 120, height: 60, color: "green" },
      { id: "p1", label: `Execute: ${cleanPrompt}`, type: "rectangle", x: 270, y: 250, width: 180, height: 70, color: "blue" },
      { id: "check", label: "Check status?", type: "diamond", x: 300, y: 400, width: 120, height: 120, color: "orange" },
      { id: "success", label: "Success", type: "rectangle", x: 270, y: 600, width: 180, height: 70, color: "green" },
      { id: "fail", label: "Fail / Retry", type: "rectangle", x: 540, y: 425, width: 150, height: 70, color: "red" },
    ],
    edges: [
      { from: "start", to: "p1", label: "" },
      { from: "p1", to: "check", label: "" },
      { from: "check", to: "success", label: "Yes" },
      { from: "check", to: "fail", label: "No" },
      { from: "fail", to: "p1", label: "Retry" },
    ],
  };
}
