const express = require('express');
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/generate-code', async (req, res) => {
    const { prompt, context } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const systemInstruction = `You are a Senior Roblox Studio Automation Engineer. You create full, scaled, game systems.
    You must ALWAYS respond with ONLY raw JSON. Do not include markdown blocks like \`\`\`json. Do not include any trailing conversational text outside the JSON.
    
    Format your response EXACTLY like this schema:
    {
      "chat_reply": "A professional explanation of the architectural changes, positions, and code logic deployed.",
      "instructions": [
        {
          "action": "create" or "edit",
          "class_name": "Script" or "LocalScript" or "ModuleScript" or "Part" or "ScreenGui" or "Frame" or "TextButton" or "TextLabel" or "SpawnLocation",
          "name": "PascalCaseName",
          "parent_service": "Workspace" or "StarterGui" or "ServerScriptService" or "StarterPlayer" or "ReplicatedStorage",
          "parent_path": "",
          "properties": {},
          "code": "-- Code logic here"
        }
      ]
    }`;

    // Force a long-lived execution cycle to prevent gateway timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second safety ceiling

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemInstruction}\n\nContext:\n${context}\n\nUser Request: ${prompt}` }] }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Google API returned status ${response.status}`);

        const data = await response.json();
        let resultText = data.candidates[0].content.parts[0].text;
        resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        res.json(JSON.parse(resultText));

    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Advanced AI Failure Logic:", error);
        res.status(500).json({ 
            chat_reply: "⚠️ The processing pipeline timed out or ran into an execution hurdle. Please click the retry button below to send again.", 
            instructions: [] 
        });
    }
});

// To keep Render awake: If you want to stop it from sleeping entirely, 
// you can use a free uptime monitoring service (like UptimeRobot) to ping your Render URL every 10 minutes.

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => console.log(`Resilient Backend Active on ${PORT}`));
server.timeout = 60000; // Force server socket connection to stay open for 60 full seconds
