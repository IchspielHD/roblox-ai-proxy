const express = require('express');
const app = express();

app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/generate-code', async (req, res) => {
    const { prompt, context } = req.body;

    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    // The new, ultra-smart system instruction
    const systemInstruction = `You are an expert Roblox Studio AI Co-Pilot. 
    You must ALWAYS respond with ONLY raw JSON. Do not wrap the JSON in markdown blocks like \`\`\`json.
    
    You will receive the user's prompt and their current Explorer Selection (Context). 
    If they have a script selected, assume they want to modify it unless they say otherwise.
    
    Respond strictly in this JSON format:
    {
      "chat_reply": "A helpful, conversational message explaining exactly what you did.",
      "action": "create" OR "edit",
      "target_name": "A smart, descriptive PascalCase name for the script (e.g. ZombieSpawner)",
      "code": "The raw, completely functional Luau code"
    }`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: `${systemInstruction}\n\nContext (User's Explorer Selection):\n${context}\n\nUser Request: ${prompt}` }] 
                }]
            })
        });

        const data = await response.json();
        let resultText = data.candidates[0].content.parts[0].text;
        
        // Clean up formatting in case Gemini accidentally adds markdown
        resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Parse the JSON and send it back to Roblox
        const parsedResponse = JSON.parse(resultText);
        res.json(parsedResponse);

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ 
            chat_reply: "I ran into a server error trying to process that. Check the backend logs!", 
            action: "error",
            target_name: "",
            code: ""
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Server is running on port ${PORT}`);
});
