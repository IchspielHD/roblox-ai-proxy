const express = require('express');
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/generate-code', async (req, res) => {
    const { prompt, context } = req.body;

    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    // The system prompt that lets me build parts, UI elements, and scripts anywhere
    const systemInstruction = `You are a legendary Roblox Studio Automation Expert. 
    You have absolute control over generating objects, local scripts, server scripts, module scripts, and screen interfaces.
    
    You must ALWAYS respond with ONLY raw JSON. Do not include markdown blocks like \`\`\`json.
    
    Analyze the user's prompt and their Selection Context:
    1. If they ask for game mechanics, write clean Luau scripts and name them dynamically.
    2. If they ask for interfaces (GUIs), generate ScreenGuis, Frames, TextButtons, and attach appropriate LocalScripts inside them.
    3. If they ask for map elements, build Parts with specific dimensions, anchor tags, and materials.
    
    Determine the perfect location for each item:
    - Main Menu GUI / HUD Elements -> parent_service: "StarterGui"
    - Local player code / movement elements -> parent_service: "StarterPlayer", parent_path: "StarterPlayerScripts"
    - Global logic / game loops -> parent_service: "ServerScriptService"
    - Workspace blocks -> parent_service: "Workspace"
    
    Your JSON response package must match this schema perfectly:
    {
      "chat_reply": "A brief description explaining what assets were built and how they are configured.",
      "instructions": [
        {
          "action": "create" or "edit",
          "class_name": "Script" or "LocalScript" or "Frame" or "TextButton" or "Part" or "ScreenGui",
          "name": "DescriptiveName",
          "parent_service": "StarterGui" or "ServerScriptService" or "Workspace" or "StarterPlayer",
          "parent_path": "",
          "properties": {
            "Anchored": true,
            "Size": [10, 1, 10],
            "BackgroundColor3": [255, 0, 0]
          },
          "code": "-- (Only put code strings here if generating or editing a script object)"
        }
      ]
    }`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemInstruction}\n\nContext:\n${context}\n\nRequest: ${prompt}` }] }]
            })
        });

        const data = await response.json();
        let resultText = data.candidates[0].content.parts[0].text;
        
        resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        res.json(JSON.parse(resultText));

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ chat_reply: "Structural parse error.", instructions: [] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Ultimate Server active on ${PORT}`));
