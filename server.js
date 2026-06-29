const express = require('express');
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/generate-code', async (req, res) => {
    const { prompt, context } = req.body;

    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    // Advanced schema forcing Gemini to mathematically compute scaling and handle complex asset types
    const systemInstruction = `You are a Senior Roblox Studio Automation Engineer. You create full, scaled, game systems.
    You must ALWAYS respond with ONLY raw JSON. Do not include markdown blocks like \`\`\`json. Do not include any trailing conversational text outside the JSON.
    
    When creating physical items, always mathematically compute realistic scales, offsets, and positions based on standard Roblox character metrics (e.g., standard character size is [4, 5, 1]).
    If the user requests complex structures (like a house, obstacle course, or UI layout), break it down into multiple clear instructions in the array.
    
    Ensure you specify local scripts vs server scripts intelligently:
    - Interactive buttons, UI animations, Camera changes -> LocalScript
    - Saving data, spawning enemies, Leaderboards, health subtraction -> Script
    
    Format your response EXACTLY like this schema:
    {
      "chat_reply": "A professional explanation of the architectural changes, positions, and code logic deployed.",
      "instructions": [
        {
          "action": "create" or "edit",
          "class_name": "Script" or "LocalScript" or "ModuleScript" or "Part" or "ScreenGui" or "Frame" or "TextButton" or "TextLabel" or "SpawnLocation",
          "name": "PascalCaseName",
          "parent_service": "Workspace" or "StarterGui" or "ServerScriptService" or "StarterPlayer" or "ReplicatedStorage",
          "parent_path": "Optional/Folder/Path/Here",
          "properties": {
            "Anchored": true,
            "CanCollide": true,
            "Size": [10, 5, 10],
            "Position": [0, 2.5, 0],
            "BackgroundColor3": [35, 35, 40],
            "TextColor3": [255, 255, 255],
            "Text": "Label Text"
          },
          "code": "-- Clean, bug-free, highly optimized Luau code here"
        }
      ]
    }`;

    try {
        // Using an optimized model request wrapper to avoid latency overhead drops
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemInstruction}\n\nContext:\n${context}\n\nUser Request: ${prompt}` }] }]
            })
        });

        if (!response.ok) throw new Error(`Google API returned status ${response.status}`);

        const data = await response.json();
        let resultText = data.candidates[0].content.parts[0].text;
        
        resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Validate JSON before sending back to Roblox
        const jsonValid = JSON.parse(resultText);
        res.json(jsonValid);

    } catch (error) {
        console.error("Advanced AI Failure Logic:", error);
        res.status(500).json({ 
            chat_reply: "⚠️ The processing pipeline timed out or ran into a structural code layout error. Please refine your generation parameters.", 
            instructions: [] 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Resilient Multi-Agent Backend Listening on ${PORT}`));
