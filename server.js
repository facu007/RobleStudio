/**
 * Roble Studio - Servidor Backend Local Funcional
 * 
 * Path: server.js
 * 
 * Este servidor se ejecuta en el puerto 3001 para soportar:
 * 1. POST /api/chat -> Integración segura con OpenAI GPT-4o e inyección del System Prompt.
 * 2. POST /api/lead -> Persistencia directa de datos de cotizaciones en la tabla 'leads' de Supabase.
 * 3. POST /api/booking -> Persistencia directa de agendamientos en la tabla 'bookings' de Supabase.
 * 
 * CARACTERÍSTICAS PREMIUM:
 * - Cero dependencias externas (utiliza módulos nativos http, https y fs).
 * - Carga automática de variables en el archivo .env de forma nativa.
 * - Registro robusto de auditoría en consola y manejo ágil de CORS.
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const PORT = 3001;

// 1. Cargar Variables de Entorno del archivo .env de forma manual y robusta
const env = {};
try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const match = trimmedLine.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    let val = match[2].trim();
                    // Remover comillas alrededor del valor si existen
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    env[key] = val;
                    process.env[key] = val; // Hacerlo disponible para bibliotecas también
                }
            }
        });
        console.log('🌱 Variables del archivo .env cargadas con éxito.');
    } else {
        console.warn('⚠️ Archivo .env no encontrado. Asegúrate de crearlo en la raíz.');
    }
} catch (error) {
    console.error('❌ Error leyendo el archivo .env:', error);
}

// Prompt Oficial de Producción de Roble Studio
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

// Helper para realizar peticiones HTTPs asíncronas de forma nativa (Zero-Dependencies)
function makeHttpsRequest(url, options, bodyData) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const reqOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOptions, (res) => {
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    text: () => Promise.resolve(rawData),
                    json: () => Promise.resolve(JSON.parse(rawData))
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (bodyData) {
            req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
        }
        req.end();
    });
}

// Crear Servidor HTTP
const server = http.createServer(async (req, res) => {
    // Configuración de cabeceras de CORS globales
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar llamada Pre-flight de CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Registro de logs
    console.log(`[${new Date().toISOString().substring(11, 19)}] 请求: ${req.method} ${req.url}`);

    // Enrutar endpoints
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { messages } = JSON.parse(body);

                if (!messages || !Array.isArray(messages)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Falta la conversación o es inválida.' }));
                    return;
                }

                const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

                if (!openAiKey) {
                    console.warn('⚠️ OPENAI_API_KEY no configurada. Devolviendo respuesta explicativa simulada.');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        reply: '¡Hola! Veo que estás probando mi interfaz de inteligencia artificial. 😊 Para habilitar mis respuestas estratégicas completas mediante GPT-4o de OpenAI, debes configurar tu **`OPENAI_API_KEY`** en el archivo `.env` del proyecto y reiniciar el servidor local. ¡Tus activos tendrán raíces de roble!'
                    }));
                    return;
                }

                // Inyectar prompt de sistema de Roble Assistant
                const apiMessages = [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...messages.map(m => ({ role: m.role, content: m.content }))
                ];

                const openAiResult = await makeHttpsRequest('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openAiKey}`
                    }
                }, {
                    model: 'gpt-4o',
                    temperature: 0.6,
                    max_tokens: 300,
                    presence_penalty: 0.3,
                    frequency_penalty: 0.2,
                    messages: apiMessages
                });

                if (!openAiResult.ok) {
                    const errorText = await openAiResult.text();
                    throw new Error(`OpenAI API falló con estado ${openAiResult.status}: ${errorText}`);
                }

                const data = await openAiResult.json();
                const reply = data.choices?.[0]?.message?.content || 'Disculpa, no he podido asimilar la respuesta. ¿Podrías replantearlo?';

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply }));

            } catch (error) {
                console.error('❌ Error en el endpoint /api/chat:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error interno al procesar el chat.', details: error.message }));
            }
        });
    } 
    else if (req.url === '/api/lead' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const leadPayload = JSON.parse(body);
                console.log('🌿 Recibido nuevo lead de cotización:', leadPayload);

                const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
                const supabaseKey = env.SUPABASE_KEY || process.env.SUPABASE_KEY;

                if (!supabaseUrl || !supabaseKey) {
                    console.warn('⚠️ Supabase no configurado en .env. El lead no se guardará en la base de datos.');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Lead procesado localmente (configura Supabase en .env para persistencia).' }));
                    return;
                }

                // Mapear datos al esquema de la tabla de Supabase
                const dbRow = {
                    source: leadPayload.source || 'Roble Assistant Chatbot',
                    client_name: leadPayload.client_name,
                    client_business: leadPayload.client_business,
                    client_sector: leadPayload.client_sector,
                    client_email: leadPayload.client_email,
                    client_phone: leadPayload.client_phone,
                    client_goal: leadPayload.client_goal
                };

                // Petición REST directa a Supabase
                const targetUrl = `${supabaseUrl}/rest/v1/leads`;
                const supabaseResult = await makeHttpsRequest(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Prefer': 'return=representation'
                    }
                }, dbRow);

                if (!supabaseResult.ok) {
                    const errorText = await supabaseResult.text();
                    throw new Error(`Supabase REST falló con estado ${supabaseResult.status}: ${errorText}`);
                }

                console.log('✅ Lead guardado con éxito en Supabase Database!');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));

            } catch (error) {
                console.error('❌ Error en el endpoint /api/lead:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error al procesar el lead.', details: error.message }));
            }
        });
    } 
    else if (req.url === '/api/booking' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const bookingPayload = JSON.parse(body);
                console.log('📅 Recibido nuevo agendamiento de cita:', bookingPayload);

                const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL;
                const supabaseKey = env.SUPABASE_KEY || process.env.SUPABASE_KEY;

                if (!supabaseUrl || !supabaseKey) {
                    console.warn('⚠️ Supabase no configurado en .env. El agendamiento no se guardará en la base de datos.');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Cita procesada localmente (configura Supabase en .env para persistencia).' }));
                    return;
                }

                // Mapear datos al esquema de la tabla de Supabase
                const dbRow = {
                    name: bookingPayload.name,
                    email: bookingPayload.email,
                    business: bookingPayload.business,
                    website: bookingPayload.website,
                    goal: bookingPayload.goal,
                    date_key: bookingPayload.dateKey,
                    booking_time: bookingPayload.time,
                    timezone: bookingPayload.timezone,
                    timezone_label: bookingPayload.timezoneLabel
                };

                // Petición REST directa a Supabase
                const targetUrl = `${supabaseUrl}/rest/v1/bookings`;
                const supabaseResult = await makeHttpsRequest(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Prefer': 'return=representation'
                    }
                }, dbRow);

                if (!supabaseResult.ok) {
                    const errorText = await supabaseResult.text();
                    throw new Error(`Supabase REST falló con estado ${supabaseResult.status}: ${errorText}`);
                }

                console.log('✅ Cita de agendamiento guardada con éxito en Supabase!');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));

            } catch (error) {
                console.error('❌ Error en el endpoint /api/booking:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error al procesar el agendamiento.', details: error.message }));
            }
        });
    } 
    else {
        // Enrutador fallback para URLs inexistentes
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Recurso no encontrado.' }));
    }
});

// Arrancar el Servidor
server.listen(PORT, () => {
    console.log('\n=====================================================================');
    console.log(`🌿 ROBLE ASSISTANT BACKEND INICIADO`);
    console.log(`🚀 Corriendo en: http://localhost:${PORT}`);
    console.log(`🌿 Listo para integraciones seguras con OpenAI y Supabase!`);
    console.log('=====================================================================\n');
});
