const express = require('express');
const app = express();

// Automatically parse incoming JSON data from Roblox
app.use(express.json());

// Pull your secret Gemini API Key from Render's environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/generate-code', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "No prompt provided" });
    }

    // Strict system instructions telling Gemini how to act and behave
    const systemInstruction = "You are an expert Roblox Luau script writer. Generate ONLY clean, functional, valid Luau code. Do not wrap code in markdown formatting like triple backticks (```). Do not include any chatty dialogue, explanations, or text other than the raw script code.";

    try {
        // Send a request directly to Google's Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: `${systemInstruction}\n\nUser Request: ${prompt}` }] 
                }]
            })
        });

        const data = await response.json();
        
        // Extract the generated code from Google's complex JSON response layout
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const generatedCode = data.candidates[0].content.parts[0].text;
            res.json({ code: generatedCode });
        } else {
            res.status(500).json({ error: "Invalid response from Gemini API" });
        }

    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        res.status(500).json({ error: "Failed to connect to AI server" });
    }
});

// Start the server on port 3000 (Render will route public traffic here)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});