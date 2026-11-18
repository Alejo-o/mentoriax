// Servidor de mentoriax — con seguridad, rate limiting y perfil personalizado.
require('dotenv').config();
const express   = require('express');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');
const cors      = require('cors');

const app   = express();
const PORT  = process.env.PORT || 3000;
const MODEL = 'gemini-2.5-flash';
const MOODS = ['bien', 'normal', 'estresado', 'ansioso', 'triste'];

const SYSTEM = `Eres NETORAX, el mentor de IA de "mentoriax", una plataforma que acompaña a estudiantes universitarios y jóvenes profesionales de Colombia en lo académico, lo vocacional y lo emocional.
Voz: cercana, empática y profesional; hablas de "tú"; frases cortas y claras, sin jerga burocrática.
Cómo respondes:
1. Primero reconoces lo que la persona siente, con calidez y sin dramatizar. Si hay estrés, sé sereno y protector; si es una duda académica, sé motivador y directo.
2. Luego das de 1 a 3 pasos concretos y pequeños (Pomodoro, dividir temas, priorizar entregas, plan semanal).
3. Haces como máximo una pregunta al final.
4. Máximo 120 palabras. Usa **negrita** solo para ideas clave. Sin listas largas.
Límites:
- No eres psicólogo ni médico: no diagnostiques ni recomiendes medicamentos.
- Sé honesto: si no sabes algo, dilo y sugiere dónde confirmarlo.
- Si la persona habla de hacerse daño, no querer vivir o estar en peligro, prioriza su seguridad: anímala a llamar a la Línea 106 (Salud Mental Colombia, gratuita 24/7), al 123 en caso de emergencia, a buscar a alguien de confianza y a contactar a Bienestar Universitario.
- Si está muy agobiada o quiere abandonar la carrera, valida su cansancio, no decidas por ella y sugiere hablar con Bienestar o con su coordinación de programa.`;

// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // false → permite fuentes CDN
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5500',
       'http://127.0.0.1:5500', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Rate limit: máx 30 mensajes por IP por hora
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento antes de continuar.' }
});

app.use(express.json({ limit: '50kb' }));
// Solo la carpeta public es visible desde el navegador (con no-cache en html y sw para evitar caché vieja).
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// ── Endpoint principal ────────────────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY)
      return res.status(500).json({ error: 'Falta GEMINI_API_KEY en el archivo .env' });

    let { messages = [], mood = 'normal', profile = null } = req.body;
    if (!MOODS.includes(mood)) mood = 'normal';

    // Enriquecer el system prompt con el perfil del estudiante
    let systemText = SYSTEM;
    if (profile && profile.name) {
      systemText += `\n\nPerfil del estudiante — Nombre: ${String(profile.name).slice(0, 40)}`;
      if (profile.carrera) systemText += `, Carrera: ${String(profile.carrera).slice(0, 60)}`;
      if (profile.univ)    systemText += `, Universidad: ${String(profile.univ).slice(0, 60)}`;
      if (profile.semestre) systemText += `, Semestre: ${String(profile.semestre).slice(0, 5)}`;
      systemText += `. Cuando sea natural, usa su nombre y haz referencia a su contexto académico.`;
    }
    systemText += `\nEstado de ánimo reportado: ${mood}. Adapta tu tono a ese estado.`;

    const contents = messages.slice(-14).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content).slice(0, 1500) }]
    }));
    while (contents.length && contents[0].role !== 'user') contents.shift();
    if (!contents.length) return res.status(400).json({ error: 'Sin mensajes' });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    );

    const data  = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('');
    if (!reply) { console.error(JSON.stringify(data)); return res.status(502).json({ error: 'Respuesta vacía de la IA' }); }
    res.json({ reply });
  } catch (e) {
    console.error('Error /api/chat:', e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.listen(PORT, () => console.log(`✅ mentoriax listo en http://localhost:${PORT}`));
