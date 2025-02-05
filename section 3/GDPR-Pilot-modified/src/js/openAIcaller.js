//file needed to generate the API call to OpenAI

const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");
const OpenAI = require("openai");

require("dotenv").config();

app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET"],
    allowedHeaders: ["Content-Type"],
  })
);

const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;

const openai = new OpenAI({
  apiKey: API_KEY,
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  next();
});

app.get("/api/call_chat_gpt", async (req, res) => {
  const userMessage = req.query.message || "Hello!";
  try {
    // Richiesta manuale con Axios
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Risposta dalla API di OpenAI
    const message = response.data.choices[0].message;

    // Invia la risposta al client
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
    res.json(message);
  } catch (error) {
    // Gestione degli errori
    console.error("Error during the request:", error.response?.data || error.message || error);
    res.status(500).json({
      error: "Errore to recover sensible information",
    });
  }
});


app.listen(PORT, () => {
  console.log(`server executing on port ${PORT}`);
});