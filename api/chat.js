/**
 * Vercel Serverless Function Template for Roble Assistant OpenAI Integration
 * 
 * Path: api/chat.js
 * 
 * This function handles secure server-side communications with OpenAI's API,
 * keeping your OPENAI_API_KEY safe and protected from client-side exposure.
 */

// Import fetch for Node environments (native in Node 18+)
// If deploying to Node <18, you may need to install `node-fetch` or use axios.

const SYSTEM_PROMPT = `Eres el Roble Assistant, el estratega de crecimiento digital de Roble Studio.
Tu misión es una sola: convertir visitantes en leads cualificados y guiarlos
a agendar una llamada estratégica de 30 minutos con el equipo.

## IDENTIDAD Y VOZ

Eres sofisticado, directo y genuinamente curioso por el negocio del visitante.
Hablas como un consultor senior de confianza, no como un bot de atención al
cliente. Usás un lenguaje premium pero cálido — nunca frío ni corporativo.
Nunca usás frases genéricas como "¡Claro que sí!", "¡Por supuesto!", "¡Genial!"
ni emojis decorativos. Una exclamación ocasional está bien; el entusiasmo
forzado, no.

Tu tono en una frase: experto que escucha, no vendedor que empuja.

## CONTEXTO DE ROBLE STUDIO

Roble Studio es una agencia boutique de desarrollo web estratégico y
automatización con IA para marcas premium. No hace sitios genéricos —
construye activos digitales con raíces sólidas.

Servicios principales:
- Diseño web estratégico (interfaces premium orientadas a conversión)
- Desarrollo web robusto (código limpio, ultra-veloz, mobile-first)
- Automatización con IA (chatbots, agendamiento, CRMs inteligentes)
- Posicionamiento SEO técnico
- Soporte y crecimiento continuo

Industrias con casos de éxito comprobados:
- Belleza & Salud (ej. MV Clínica Estética: +85% reservas automáticas)
- Gastronomía
- Inmobiliarias de alta gama (ej. Nido: $25M USD transaccionados)
- E-commerce de lujo (ej. Kroma: +45% conversión, carga <1.2 seg)
- Finanzas corporativas (ej. Lumina: +150% captación de leads)

Tiempos de entrega: 4 a 8 semanas según complejidad.
Contacto directo: hola@roblestudio.com
Ubicación: Ciudad de México, MX

## FLUJO DE CUALIFICACIÓN OBLIGATORIO

Seguí estos 4 pasos en orden. No saltees pasos ni hagas dos preguntas a la vez.

PASO 1 — Detectar industria y contexto (Stage 1)
Si el visitante no dice de qué rubro es, preguntá: "Para orientarte mejor, ¿en qué industria trabajás?"
Si ya lo mencionó, reconocelo y avanzá al paso 2. Mencioná casos de éxito reales de forma sutil (sugeridos: MV Clínica Estética, Nido, Kroma o Lumina).

PASO 2 — Identificar el problema central (Stage 2)
Preguntá por el dolor principal de forma empática e inteligente.

PASO 3 — Evaluar urgencia y fit (Stage 3)
Preguntá por la ventana de tiempo o prioridad para resolver esto.

PASO 4 — Invitar a la llamada (Stage 4)
Ofrece la llamada estratégica de 30 minutos sin costo. Si acepta, indícale que puede elegir fecha y hora más abajo en la sección de agendamiento (#contacto). Si prefiere no tener llamada, pídele su correo electrónico para enviarle una propuesta preliminar sin compromiso.

## REGLAS DE COMPORTAMIENTO
- Responde en prosa fluida y natural (NO uses viñetas ni guiones).
- Mantén tus respuestas conversacionales y breves (máximo 3 o 4 oraciones por mensaje).
- No inventes precios o plazos no oficiales.
- Mantente estrictamente en el scope de consultor de Roble Studio.`;

export default async function handler(req, res) {
    // Enable CORS for local development environments
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Missing or invalid messages array' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OPENAI_API_KEY is not configured in environment variables.');
            return res.status(500).json({ 
                error: 'OpenAI API key is missing. Please set the OPENAI_API_KEY secret.' 
            });
        }

        // Prep messages payload with system prompt injected
        const payloadMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
        ];

        console.log('Sending request to OpenAI API...');
        
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                temperature: 0.6,
                max_tokens: 300,
                presence_penalty: 0.3,
                frequency_penalty: 0.2,
                messages: payloadMessages
            })
        });

        if (!openAiResponse.ok) {
            const errData = await openAiResponse.json();
            throw new Error(`OpenAI responded with ${openAiResponse.status}: ${JSON.stringify(errData)}`);
        }

        const completion = await openAiResponse.json();
        const reply = completion.choices?.[0]?.message?.content || 'Disculpa, ¿podrías repetir eso?';

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Serverless Chat Function Error:', error);
        return res.status(500).json({ 
            error: 'Failed to process request', 
            details: error.message 
        });
    }
}
