// server.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Setup Express
const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse URL-encoded bodies (for HTML form data)
app.use(express.urlencoded({ extended: true }));
// Middleware to serve static files (like index.html)
app.use(express.static(__dirname));

// Initialize Gemini Client
// The GoogleGenAI constructor automatically looks for the GEMINI_API_KEY
// in the process.env environment variables.
const ai = new GoogleGenAI({}); 
const model = "gemini-2.5-flash";

// Helper function to render the HTML template with a response
const renderHtml = (response = "Submit a prompt to see the response.") => {
    // Read the index.html file content
    const htmlPath = path.join(__dirname, 'index.html');
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gemini API with Node.js</title>
        </head>
        <body>
            <h1>Ask Gemini</h1>
            <form action="/generate-text" method="POST">
                <label for="prompt">Enter your prompt:</label><br>
                <input type="text" id="prompt" name="prompt" size="50" required>
                <button type="submit">Get Response</button>
            </form>

            <hr>

            <h2>Gemini Response:</h2>
            <div>
                <pre>${response}</pre>
            </div>
        </body>
        </html>
    `;
    return htmlContent;
};

// GET route to serve the initial page
app.get('/', (req, res) => {
    res.send(renderHtml());
});

// POST route to handle the form submission and call the Gemini API
app.post('/generate-text', async (req, res) => {
    // The prompt is available in req.body.prompt because of the 
    // `name="prompt"` attribute in the HTML input field.
    const userPrompt = req.body.prompt;
    let geminiResponse = 'An error occurred or no response was generated.';

    if (!userPrompt) {
        return res.send(renderHtml('Error: Prompt is missing.'));
    }

    try {
        // Call the Gemini API
        const result = await ai.generateContent({
            model: model,
            contents: userPrompt,
        });

        // Extract the text from the response
        geminiResponse = result.text;
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        geminiResponse = `Error: Failed to get response from Gemini. Check your API key and server logs. Details: ${error.message}`;
    }

    // Send the HTML page back to the client with the Gemini response
    // Note: In a real app, you'd typically redirect or use a dedicated templating engine.
    res.send(renderHtml(geminiResponse));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
