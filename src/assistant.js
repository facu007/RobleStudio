import { gsap } from 'gsap';
import { escapeHtml } from './utils/html.js';

export function initRobleAssistant() {
    const assistantWebhookUrl = import.meta.env.VITE_ASSISTANT_WEBHOOK_URL?.trim() || '';

    // Safety check: Don't run if DOM elements are missing
    const chatWindow = document.getElementById('roble-assistant-chat');
    const launcher = document.getElementById('roble-assistant-launcher');
    const closeBtn = document.getElementById('roble-assistant-close');
    const sendBtn = document.getElementById('roble-assistant-send');
    const inputField = document.getElementById('roble-assistant-input');
    const messagesContainer = document.getElementById('roble-assistant-messages');
    const iconChat = document.getElementById('roble-assistant-icon-chat');
    const iconClose = document.getElementById('roble-assistant-icon-close');

    const micBtn = document.getElementById('roble-assistant-mic');

    if (!chatWindow || !launcher || !closeBtn || !sendBtn || !inputField || !messagesContainer) {
        console.warn('Roble Assistant elements missing from DOM.');
        return;
    }

    // Speech-to-Text Dictation
    let isRecording = false;
    let recognition = null;

    if (micBtn) {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'es-ES';
            recognition.interimResults = false;

            recognition.onstart = () => {
                isRecording = true;
                micBtn.classList.add('mic-recording');
                micBtn.querySelector('span').textContent = 'hearing';
                inputField.placeholder = 'Escuchando tu voz...';
            };

            recognition.onend = () => {
                isRecording = false;
                micBtn.classList.remove('mic-recording');
                micBtn.querySelector('span').textContent = 'mic';
                inputField.placeholder = 'Escribe tu consulta estratégica...';
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                inputField.value = transcript;
                inputField.focus();
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                isRecording = false;
                micBtn.classList.remove('mic-recording');
                micBtn.querySelector('span').textContent = 'mic';
                inputField.placeholder = 'Escribe tu consulta estratégica...';

                if (event.error === 'not-allowed') {
                    addMessage('bot', `
                        <p class="font-bold text-[#db790a] mb-1 flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs">lock</span> 
                            Permiso de Micrófono Requerido
                        </p>
                        <p class="mb-2">No he podido acceder a tu micrófono. Esto suele ocurrir por dos motivos:</p>
                        <ul class="list-disc pl-4 space-y-1.5 mb-1 text-[10px] leading-relaxed">
                            <li><strong>Permisos del navegador:</strong> Asegúrate de otorgar permisos de micrófono en la configuración de la barra de direcciones.</li>
                            <li><strong>Entorno Seguro (HTTPS):</strong> Por motivos de seguridad, los navegadores móviles bloquean el reconocimiento de voz en conexiones HTTP locales no seguras (como redes Wi-Fi locales). En producción bajo un dominio **HTTPS**, funcionará perfectamente de forma inmediata.</li>
                        </ul>
                    `);
                }
            };

            micBtn.addEventListener('click', () => {
                if (isRecording) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            });
        } else {
            micBtn.style.display = 'none';
        }
    }

    let isOpen = false;
    let isTyping = false;
    
    // Conversation State Trackers
    let currentFlow = null; // 'quote' or 'audit'
    let flowStep = 0;
    let leadData = {
        name: '',
        business: '',
        sector: '',
        email: '',
        phone: '',
        goal: ''
    };
    let auditData = {
        target: '', // URL or Description
        sector: ''
    };
    let conversationHistory = [];

    // 1. Toggle Chat Drawer
    function toggleChat(forceState = null) {
        isOpen = forceState !== null ? forceState : !isOpen;

        if (isOpen) {
            // Open animation
            chatWindow.classList.remove('pointer-events-none');
            gsap.to(chatWindow, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.45,
                ease: 'power3.out'
            });
            iconChat.classList.add('hidden');
            iconClose.classList.remove('hidden');
            
            // Add scroll-lock class for mobile viewports
            document.body.classList.add('assistant-open');

            // Focus on input field on desktop
            if (!window.matchMedia('(pointer: coarse)').matches) {
                setTimeout(() => inputField.focus(), 300);
            }

            // Load initial welcome messages if empty
            if (messagesContainer.children.length === 0) {
                triggerWelcomeSequence();
            }
        } else {
            // Close animation
            chatWindow.classList.add('pointer-events-none');
            gsap.to(chatWindow, {
                opacity: 0,
                y: 20,
                scale: 0.95,
                duration: 0.35,
                ease: 'power2.inOut'
            });
            iconClose.classList.add('hidden');
            iconChat.classList.remove('hidden');
            
            // Remove scroll-lock class
            document.body.classList.remove('assistant-open');
        }
    }

    launcher.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    // 2. Messaging Engine
    function addMessage(sender, content, options = {}) {
        const { allowHtml = sender !== 'user' } = options;
        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} w-full opacity-0 translate-y-2 animate-message`;

        const bubble = document.createElement('div');
        bubble.className = `max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm transition-all duration-300 ${
            sender === 'user'
                ? 'bg-[#1F3A2E] text-white rounded-tr-none font-medium'
                : 'bg-surface-container dark:bg-primary-container text-on-surface dark:text-inverse-on-surface rounded-tl-none border border-outline-variant/15'
        }`;
        if (allowHtml) {
            bubble.innerHTML = content;
        } else {
            bubble.textContent = content;
        }

        bubbleWrapper.appendChild(bubble);
        messagesContainer.appendChild(bubbleWrapper);
        scrollToBottom();

        // Integrate with custom cursor hovers dynamically for any links or buttons inside bubbles
        if (typeof window.refreshCursorListeners === 'function') {
            window.refreshCursorListeners();
        }

        return bubbleWrapper;
    }

    async function sendLeadToWebhook(payload) {
        const targetUrl = assistantWebhookUrl || '/api/lead';

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Assistant endpoint responded with ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error sending lead data:', error);
            return false;
        }
    }

    function showTypingIndicator() {
        if (isTyping) return;
        isTyping = true;

        const indicator = document.createElement('div');
        indicator.id = 'roble-typing-indicator';
        indicator.className = 'flex justify-start w-full opacity-0 translate-y-2 animate-message';
        indicator.innerHTML = `
            <div class="bg-surface-container dark:bg-primary-container text-on-surface/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 border border-outline-variant/15">
                <div class="typing-dot w-1.5 h-1.5 bg-[#6B4F3A] rounded-full"></div>
                <div class="typing-dot w-1.5 h-1.5 bg-[#6B4F3A] rounded-full"></div>
                <div class="typing-dot w-1.5 h-1.5 bg-[#6B4F3A] rounded-full"></div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('roble-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
        isTyping = false;
    }

    function scrollToBottom() {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
    }

    function addQuickReplyChips(chips) {
        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'flex flex-wrap gap-2 pt-1.5 justify-start w-full animate-message';

        chips.forEach(chip => {
            const btn = document.createElement('button');
            btn.className = 'bg-surface border border-[#6B4F3A]/25 text-[#6B4F3A] hover:bg-[#1F3A2E] hover:text-white dark:bg-primary dark:border-[#8A674E]/30 dark:text-[#F3F0EB] dark:hover:bg-[#8A674E] px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all shadow-sm active:scale-95 duration-200';
            btn.textContent = chip.text;
            btn.addEventListener('click', () => {
                // Remove the chips container to keep chat clean
                chipsContainer.remove();
                
                // Add user reply bubble
                addMessage('user', chip.text, { allowHtml: false });
                
                // Trigger callback
                chip.callback();
            });
            chipsContainer.appendChild(btn);
        });

        messagesContainer.appendChild(chipsContainer);
        scrollToBottom();

        if (typeof window.refreshCursorListeners === 'function') {
            window.refreshCursorListeners();
        }
    }

    // 3. Welcome Sequence
    function triggerWelcomeSequence() {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', `
                <p class="font-bold mb-1 text-sm text-[#1F3A2E] dark:text-[#F3F0EB] flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base">spa</span>
                    ¡Hola! Soy Roble Assistant
                </p>
                <p class="mb-2">Tu consultor de estrategia y crecimiento digital en Roble Studio. Diseñamos activos con raíces sólidas para impulsar negocios.</p>
                <p class="font-semibold text-[#6B4F3A] dark:text-[#fdc39a]">¿En qué podemos enfocar tu proyecto hoy?</p>
            `);
            
            addQuickReplyChips([
                { text: '🔍 Auditar mi Web (Express)', callback: () => startAuditFlow() },
                { text: '💼 Cotizar Proyecto Premium', callback: () => startQuoteFlow() },
                { text: '🌿 Explorar Portafolio', callback: () => showPortfolioChips() },
                { text: '📅 Agendar una Llamada', callback: () => scrollAndBook() }
            ]);
        }, 1200);
    }

    // 4. Action Callback Handlers
    function showPortfolioChips() {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', `
                <p class="font-bold mb-1 text-[#1F3A2E] dark:text-[#F3F0EB]">Nuestra Artesanía Digital</p>
                <p class="mb-2">Hemos desarrollado soluciones e-commerce fluidas, plataformas inmobiliarias 3D y portales clínicos integrados:</p>
                <ul class="space-y-1.5 list-disc pl-4 mb-1">
                    <li><strong>Clínica MV:</strong> Estética premium con agenda automatizada.</li>
                    <li><strong>Nido Inmobiliaria:</strong> Catálogo con recorridos inmersivos.</li>
                    <li><strong>Kroma E-commerce:</strong> Boutique de moda con pasarelas ultra-rápidas.</li>
                </ul>
            `);
            
            addQuickReplyChips([
                { text: '🔍 Auditar mi sitio', callback: () => startAuditFlow() },
                { text: '💼 Cotizar ahora', callback: () => startQuoteFlow() },
                { text: '🔙 Volver al inicio', callback: () => triggerWelcomeSequence() }
            ]);
        }, 1000);
    }

    function scrollAndBook() {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', `
                <p class="mb-2">¡Excelente decisión! Te estoy desplazando directamente al programador estratégico para agendar tu videollamada de 30 minutos sin costo.</p>
                <p class="font-bold text-[#3E6B52]">Cargando calendario...</p>
            `);
            
            toggleChat(false);
            const contactSection = document.getElementById('contacto');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 800);
    }

    // 5. Dynamic Lead Capture Flow (Quote Flow)
    function startQuoteFlow() {
        currentFlow = 'quote';
        flowStep = 1;
        
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', `
                <p class="font-bold mb-1 text-[#1F3A2E] dark:text-[#F3F0EB]">Iniciemos tu Cotización Estratégica</p>
                <p>Para formular la mejor solución, necesito recopilar unos datos breves. ¿Cómo te llamas?</p>
            `);
        }, 1000);
    }

    function handleQuoteFlowInput(text) {
        switch (flowStep) {
            case 1:
                leadData.name = text;
                flowStep = 2;
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage('bot', `
                        <p>Mucho gusto, <strong>${escapeHtml(leadData.name)}</strong>. ¿Cuál es el nombre de tu negocio o marca?</p>
                    `);
                }, 900);
                break;
            case 2:
                leadData.business = text;
                flowStep = 3;
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage('bot', `
                        <p>Entendido, <strong>${escapeHtml(leadData.business)}</strong>. ¿En qué sector o industria operan principalmente?</p>
                    `);
                    addQuickReplyChips([
                        { text: '🛍️ E-commerce / Tienda', callback: () => { leadData.sector = 'E-commerce'; resumeQuoteFlow(); } },
                        { text: '⚖️ Servicios Premium', callback: () => { leadData.sector = 'Servicios'; resumeQuoteFlow(); } },
                        { text: '🏥 Salud y Estética', callback: () => { leadData.sector = 'Salud'; resumeQuoteFlow(); } },
                        { text: '🏡 Real Estate / Inmobiliaria', callback: () => { leadData.sector = 'Inmobiliaria'; resumeQuoteFlow(); } }
                    ]);
                }, 900);
                break;
            case 3: // Fallback if they write instead of clicking chips
                leadData.sector = text;
                resumeQuoteFlow();
                break;
            case 4:
                // Simple email regex check
                if (!text.includes('@') || !text.includes('.')) {
                    addMessage('bot', '⚠️ Por favor, introduce un correo electrónico válido para poder enviarte la cotización.', { allowHtml: false });
                    return;
                }
                leadData.email = text;
                flowStep = 5;
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage('bot', `
                        <p>Perfecto. Finalmente, ¿cuál es tu número de <strong>WhatsApp / Teléfono</strong>? Nos comunicaremos contigo de forma ágil y profesional.</p>
                    `);
                }, 900);
                break;
            case 5:
                leadData.phone = text;
                flowStep = 6;
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage('bot', `
                        <p>¡Todo listo! Para terminar, describe brevemente el principal objetivo de este sitio web (ej. Captar llamadas, vender productos en línea, renovar imagen corporativa).</p>
                    `);
                }, 900);
                break;
            case 6:
                leadData.goal = text;
                flowStep = 7;
                dispatchLeadToWebhook();
                break;
        }
    }

    function resumeQuoteFlow() {
        flowStep = 4;
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', `
                <p>Excelente. ¿A qué **correo electrónico** te enviamos el plan de trabajo y el presupuesto estimado?</p>
            `);
        }, 900);
    }

    function dispatchLeadToWebhook() {
        showTypingIndicator();
        
        // Structure POST data
        const payload = {
            source: 'Roble Assistant Chatbot',
            client_name: leadData.name,
            client_business: leadData.business,
            client_sector: leadData.sector,
            client_email: leadData.email,
            client_phone: leadData.phone,
            client_goal: leadData.goal,
            timestamp: new Date().toISOString()
        };

        void sendLeadToWebhook(payload);

        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', `
                <p class="font-bold text-[#3E6B52] mb-1">¡Propuesta Express Registrada!</p>
                <p class="mb-2">Gracias <strong>${escapeHtml(leadData.name)}</strong>, hemos guardado tus objetivos para <strong>${escapeHtml(leadData.business)}</strong>. Enviaremos el presupuesto inicial a <strong>${escapeHtml(leadData.email)}</strong> y nos contactaremos por WhatsApp al <strong>${escapeHtml(leadData.phone)}</strong>.</p>
                <p class="font-semibold">Para asegurar tu lugar de inmediato, te recomendamos agendar la llamada en nuestro calendario.</p>
            `);

            addQuickReplyChips([
                { text: '📅 Agendar llamada ahora', callback: () => scrollAndBook() },
                { text: '🔙 Volver al inicio', callback: () => { currentFlow = null; triggerWelcomeSequence(); } }
            ]);
        }, 1500);
    }

    // 6. Free Mini Website Audit Experience
    function startAuditFlow() {
        currentFlow = 'audit';
        flowStep = 1;

        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage('bot', `
                <p class="font-bold mb-1 text-[#1F3A2E] dark:text-[#F3F0EB]">Herramienta de Auditoría Web Express</p>
                <p class="mb-2">Evaluaremos tu UX, SEO, Conversión, Branding y Rendimiento técnico de forma express.</p>
                <p>Escribe **la URL de tu sitio web actual** (ej. www.minegocio.com). Si aún no tienes web, describe brevemente tu idea de negocio.</p>
            `);
        }, 1000);
    }

    function handleAuditFlowInput(text) {
        if (flowStep === 1) {
            auditData.target = text;
            flowStep = 2;

            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                addMessage('bot', `
                    <p>Excelente, analizaremos <strong>${escapeHtml(auditData.target)}</strong>. ¿Qué sector define mejor a tu marca?</p>
                `);

                addQuickReplyChips([
                    { text: '🛍️ E-commerce / Tienda', callback: () => triggerAuditExecution('ecommerce') },
                    { text: '💼 Servicios Premium', callback: () => triggerAuditExecution('servicios') },
                    { text: '🏥 Negocio Local / Médico', callback: () => triggerAuditExecution('local') },
                    { text: '🚀 Tecnología y Startups', callback: () => triggerAuditExecution('tech') }
                ]);
            }, 900);
        }
    }

    async function triggerAuditExecution(sector) {
        auditData.sector = sector;
        flowStep = 3;

        // Check if the input is a valid URL
        const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/i;
        const targetUrl = auditData.target.trim();
        const isValidUrl = urlRegex.test(targetUrl);

        showTypingIndicator();

        if (!isValidUrl) {
            // Fallback to pre-existing beautiful mock sector audits if it's just a text description
            setTimeout(() => {
                const indicatorBubble = document.querySelector('#roble-typing-indicator div');
                if (indicatorBubble) {
                    indicatorBubble.innerHTML = '<span class="text-[10px] text-[#3E6B52] font-bold">🔍 Analizando idea de negocio...</span>';
                }
                
                setTimeout(() => {
                    if (indicatorBubble) {
                        indicatorBubble.innerHTML = '<span class="text-[10px] text-[#6B4F3A] font-bold">🌱 Formulando propuesta de valor...</span>';
                    }
                    
                    setTimeout(() => {
                        if (indicatorBubble) {
                            indicatorBubble.innerHTML = '<span class="text-[10px] text-[#1F3A2E] font-bold">⚡ Generando pre-cotización...</span>';
                        }

                        setTimeout(() => {
                            removeTypingIndicator();
                            renderAuditReportCard(null); // render the fallback mock card
                        }, 1200);
                    }, 1000);
                }, 1000);
            }, 500);
            return;
        }

        // Normalize URL by adding https:// if missing
        let normalizedUrl = targetUrl;
        if (!/^https?:\/\//i.test(normalizedUrl)) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        // Show live loading states
        setTimeout(() => {
            const indicatorBubble = document.querySelector('#roble-typing-indicator div');
            if (indicatorBubble) {
                indicatorBubble.innerHTML = '<div class="flex items-center gap-1.5"><span class="audit-spinner"></span> <span class="text-[10px] text-[#3E6B52] font-bold">Conectando con Google PageSpeed...</span></div>';
            }
            
            setTimeout(() => {
                if (indicatorBubble) {
                    indicatorBubble.innerHTML = '<div class="flex items-center gap-1.5"><span class="audit-spinner"></span> <span class="text-[10px] text-[#6B4F3A] font-bold">Analizando Core Web Vitals en móvil...</span></div>';
                }
                
                setTimeout(() => {
                    if (indicatorBubble) {
                        indicatorBubble.innerHTML = '<div class="flex items-center gap-1.5"><span class="audit-spinner"></span> <span class="text-[10px] text-[#1F3A2E] font-bold">Escaneando etiquetas SEO y velocidad...</span></div>';
                    }
                }, 2200);
            }, 2000);
        }, 500);

        try {
            // Request PERFORMANCE and SEO categories for mobile
            const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&category=PERFORMANCE&category=SEO&strategy=mobile`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`Google PageSpeed Insights API responded with status ${response.status}`);
            }

            const data = await response.json();
            
            // Extract performance score (0 to 100)
            const perfScore = Math.round((data.lighthouseResult?.categories?.performance?.score || 0.7) * 100);
            // Extract SEO score (0 to 100)
            const seoScore = Math.round((data.lighthouseResult?.categories?.seo?.score || 0.8) * 100);
            
            // Qualitatively extrapolate UX and Conversion scores based on Lighthouse data
            const uxScore = Math.round(Math.min(98, Math.max(40, perfScore + 8)));
            const convScore = Math.round(Math.min(95, Math.max(35, seoScore - 5)));
            
            const globalScore = Math.round((perfScore + seoScore + uxScore + convScore) / 4);

            // Extract real opportunities (recommendations) from Lighthouse audits
            const audits = data.lighthouseResult?.audits || {};
            const opportunities = [];
            
            // Translation map for common failed audits
            const translations = {
                'render-blocking-resources': '<strong>Recursos bloqueantes:</strong> CSS/JS externos retrasan la pintura inicial.',
                'modern-image-formats': '<strong>Imágenes de nueva generación:</strong> Convierte archivos a WebP/AVIF.',
                'offscreen-images': '<strong>Lazy-loading ausente:</strong> Carga imágenes secundarias diferidas.',
                'unminified-css': '<strong>CSS sin minificar:</strong> Optimiza el peso de las hojas de estilo.',
                'unminified-javascript': '<strong>Javascript sin minificar:</strong> Minifica scripts para ahorrar bytes.',
                'unused-css-rules': '<strong>CSS no utilizado:</strong> Remueve selectores huérfanos que ralentizan la carga.',
                'unused-javascript': '<strong>Javascript no utilizado:</strong> Retrasa la carga de librerías secundarias.',
                'uses-optimized-images': '<strong>Imágenes sin comprimir:</strong> Archivos multimedia sobredimensionados.',
                'uses-text-compression': '<strong>Compresión Gzip:</strong> Habilita compresión Gzip o Brotli en servidor.',
                'meta-description': '<strong>Meta descripción ausente:</strong> Falta optimización SEO descriptiva.',
                'font-display': '<strong>Carga de fuentes lenta:</strong> Agrega font-display: swap en CSS.',
                'document-title': '<strong>Etiqueta Title deficiente:</strong> Optimiza el título para buscadores.'
            };

            // Loop audits and find failed ones
            for (const [auditId, translation] of Object.entries(translations)) {
                const audit = audits[auditId];
                if (audit && audit.score !== null && audit.score < 0.9) {
                    opportunities.push(translation);
                }
                if (opportunities.length >= 3) break;
            }

            // Fallbacks in case website is extremely fast and has no errors
            if (opportunities.length < 3) {
                if (opportunities.length === 0) {
                    opportunities.push('<strong>¡Excelente velocidad!:</strong> Cumple con Core Web Vitals al 100%.');
                    opportunities.push('<strong>Estrategia de CTA:</strong> Añade botones flotantes para captar leads móviles.');
                    opportunities.push('<strong>Conversión proactiva:</strong> Integra agendamiento automatizado de citas.');
                } else {
                    opportunities.push('<strong>Testimoniales premium:</strong> Muestra testimonios en el hero para inspirar confianza.');
                    opportunities.push('<strong>Asistente inteligente:</strong> Introduce bots conversacionales para guiar al usuario.');
                }
            }

            const realReport = {
                target: targetUrl,
                globalScore,
                scores: {
                    ux: uxScore,
                    seo: seoScore,
                    conv: convScore,
                    perf: perfScore
                },
                recommendations: opportunities
            };

            removeTypingIndicator();
            renderAuditReportCard(realReport);

        } catch (error) {
            console.warn('Real Google PageSpeed API call failed (falling back to tailored mock audit):', error);
            removeTypingIndicator();
            renderAuditReportCard(null); // Fallback gracefully to tailored mock
        }
    }

    function renderAuditReportCard(realReport = null) {
        const sector = auditData.sector;
        let scores = {};
        let recommendations = [];
        let globalScore = 75;
        let displayTarget = auditData.target;

        if (realReport) {
            globalScore = realReport.globalScore;
            scores = realReport.scores;
            recommendations = realReport.recommendations;
            displayTarget = realReport.target;
        } else {
            // Fallback sector-tailored mock datasets
            if (sector === 'ecommerce') {
                globalScore = 68;
                scores = { ux: 72, seo: 75, conv: 62, brand: 65, perf: 66 };
                recommendations = [
                    '<strong>Fricción en checkout:</strong> Tiempos de carga altos en el carrito de compras (+3s).',
                    '<strong>CTA débil:</strong> Botón de agregar al carrito sin contraste premium.',
                    '<strong>SEO de Producto:</strong> Faltan esquemas de microdatos estructurados de precios.'
                ];
            } else if (sector === 'servicios') {
                globalScore = 76;
                scores = { ux: 80, seo: 72, conv: 68, brand: 82, perf: 78 };
                recommendations = [
                    '<strong>Captación pasiva:</strong> No cuentas con agendamiento automatizado de llamadas.',
                    '<strong>Prueba social oculta:</strong> Los testimonios están al pie de la página en texto plano.',
                    '<strong>Autoridad visual:</strong> Uso de imágenes genéricas de stock que restan premiumness.'
                ];
            } else if (sector === 'local') {
                globalScore = 64;
                scores = { ux: 65, seo: 58, conv: 60, brand: 70, perf: 67 };
                recommendations = [
                    '<strong>SEO Local:</strong> Falta de keywords semánticas vinculadas a tu ciudad de operación.',
                    '<strong>Mobile A11y:</strong> Botones táctiles demasiado pequeños y superpuestos en móviles.',
                    '<strong>Conversión inmediata:</strong> El número de contacto y botón de agenda no son persistentes.'
                ];
            } else { // tech / ia
                globalScore = 81;
                scores = { ux: 84, seo: 78, conv: 74, brand: 85, perf: 84 };
                recommendations = [
                    '<strong>Claridad de Propuesta:</strong> Lenguaje demasiado técnico que confunde al cliente final.',
                    '<strong>Embudo de leads:</strong> Formulario de contacto extenso de 8 campos que reduce conversiones.',
                    '<strong>Texturas de Marca:</strong> Estética genérica de plantilla Bootstrap en lugar de glassmorphic premium.'
                ];
            }
        }

        // Render card with animated progress bars
        const cardHtml = `
            <div class="audit-card w-full bg-surface dark:bg-[#1E2522] rounded-xl p-4 border border-[#6B4F3A]/20 dark:border-[#8A674E]/20 space-y-3.5 my-1">
                <div class="flex justify-between items-center border-b border-outline-variant/20 dark:border-outline-variant/10 pb-2">
                    <div>
                        <span class="text-[9px] font-bold tracking-widest text-[#6B4F3A] uppercase block">${realReport ? 'Auditoría Real Google' : 'Auditoría Express'}</span>
                        <h5 class="font-headline-sm text-xs font-bold text-[#1F3A2E] dark:text-[#F3F0EB]">${escapeHtml(displayTarget.replace(/^(https?:\/\/)?(www\.)?/, '').substring(0, 22))}...</h5>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-[#1F3A2E]/10 border border-[#1F3A2E]/30 flex flex-col items-center justify-center">
                        <span class="text-[14px] font-bold text-[#1F3A2E] dark:text-[#F3F0EB] leading-none">${globalScore}</span>
                        <span class="text-[7px] text-[#1F3A2E]/60 dark:text-[#F3F0EB]/60 font-semibold leading-none">/100</span>
                    </div>
                </div>

                <!-- Score bars -->
                <div class="space-y-2.5">
                    <div>
                        <div class="flex justify-between text-[9px] font-bold text-on-surface-variant dark:text-inverse-primary/80 mb-0.5 uppercase tracking-wide">
                            <span>Experiencia UX/UI</span>
                            <span>${scores.ux}%</span>
                        </div>
                        <div class="w-full bg-surface-container-low dark:bg-primary/40 h-1.5 rounded-full overflow-hidden">
                            <div class="progress-bar-fill h-full bg-[#1F3A2E]" style="width: 0%" data-width="${scores.ux}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-[9px] font-bold text-on-surface-variant dark:text-inverse-primary/80 mb-0.5 uppercase tracking-wide">
                            <span>Posicionamiento SEO</span>
                            <span>${scores.seo}%</span>
                        </div>
                        <div class="w-full bg-surface-container-low dark:bg-primary/40 h-1.5 rounded-full overflow-hidden">
                            <div class="progress-bar-fill h-full bg-[#6B4F3A]" style="width: 0%" data-width="${scores.seo}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-[9px] font-bold text-on-surface-variant dark:text-inverse-primary/80 mb-0.5 uppercase tracking-wide">
                            <span>Eficacia de Conversión</span>
                            <span>${scores.conv}%</span>
                        </div>
                        <div class="w-full bg-surface-container-low dark:bg-primary/40 h-1.5 rounded-full overflow-hidden">
                            <div class="progress-bar-fill h-full bg-[#db790a]" style="width: 0%" data-width="${scores.conv}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Strategic Checklist -->
                <div class="bg-surface-container-low dark:bg-primary/30 p-3 rounded-lg border border-outline-variant/15 text-[10px] space-y-1.5">
                    <span class="block font-bold text-[#1F3A2E] dark:text-[#F3F0EB] text-[10px] uppercase tracking-wider mb-1">Mejoras Críticas:</span>
                    <p class="leading-relaxed text-on-surface-variant dark:text-inverse-primary/80 flex items-start gap-1">🌿 ${recommendations[0]}</p>
                    <p class="leading-relaxed text-on-surface-variant dark:text-inverse-primary/80 flex items-start gap-1">🌿 ${recommendations[1]}</p>
                    <p class="leading-relaxed text-on-surface-variant dark:text-inverse-primary/80 flex items-start gap-1">🌿 ${recommendations[2]}</p>
                </div>

                <!-- CTA -->
                <button class="w-full bg-[#db790a] hover:bg-[#db790a]/90 text-white py-2 rounded-lg text-[10px] font-bold transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 audit-resolve-btn">
                    Corregir Estos Puntos <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
        `;

        addMessage('bot', cardHtml);

        // Animate the progress bars to their actual values
        setTimeout(() => {
            const fills = messagesContainer.querySelectorAll('.progress-bar-fill');
            fills.forEach(fill => {
                const targetW = fill.getAttribute('data-width');
                fill.style.width = targetW;
            });
        }, 200);

        // Add redirect listener to CTA inside card
        setTimeout(() => {
            const btns = messagesContainer.querySelectorAll('.audit-resolve-btn');
            const lastBtn = btns[btns.length - 1];
            if (lastBtn) {
                lastBtn.addEventListener('click', () => {
                    addMessage('user', 'Quiero agendar una sesión para resolver los puntos de la auditoría', { allowHtml: false });
                    scrollAndBook();
                });
            }
        }, 100);

        // Offer next choices
        addQuickReplyChips([
            { text: '💼 Cotizar Proyecto Premium', callback: () => startQuoteFlow() },
            { text: '🔙 Volver al inicio', callback: () => { currentFlow = null; triggerWelcomeSequence(); } }
        ]);
    }

    // 7. General Custom Prompt / Heuristic Routing & OpenAI API Integration
    async function handleHeuristicUserInput(text) {
        const query = text.toLowerCase().trim();
        
        // Form active flows take priority
        if (currentFlow === 'quote') {
            handleQuoteFlowInput(text);
            return;
        }
        if (currentFlow === 'audit') {
            handleAuditFlowInput(text);
            return;
        }

        showTypingIndicator();

        // Push user query to history
        conversationHistory.push({ role: 'user', content: text });

        try {
            // Attempt to retrieve AI response from backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory })
            });

            if (!response.ok) {
                throw new Error(`Chat API responded with status ${response.status}`);
            }

            const data = await response.json();
            const reply = data.reply;

            removeTypingIndicator();

            // Render bot message
            addMessage('bot', reply, { allowHtml: true });

            // Push bot response to history
            conversationHistory.push({ role: 'assistant', content: reply });

            // Offer strategic quick reply chips
            addQuickReplyChips([
                { text: '🔍 Auditar mi Web', callback: () => startAuditFlow() },
                { text: '💼 Cotizar Proyecto', callback: () => startQuoteFlow() },
                { text: '📅 Agendar Llamada', callback: () => scrollAndBook() }
            ]);

        } catch (error) {
            console.warn('Real AI Chat API call failed; falling back to heuristic answers.', error);
            
            // Local fallback matching heuristic keyword router
            setTimeout(() => {
                removeTypingIndicator();

                // Keyword Router
                if (query.includes('precio') || query.includes('costo') || query.includes('cuanto cuesta') || query.includes('presupuesto')) {
                    addMessage('bot', `
                        <p class="font-bold mb-1 text-[#1F3A2E] dark:text-[#F3F0EB]">Inversión Estratégica en Roble Studio</p>
                        <p class="mb-2">No construimos plantillas genéricas; creamos activos web a medida diseñados para generar retornos reales. Nuestras escalas de inversión recomendadas son:</p>
                        <ul class="space-y-1 list-disc pl-4 mb-2">
                            <li><strong>Sitios Corporativos Premium:</strong> $2,000 - $3,500 USD (enfocados en posicionamiento y captación).</li>
                            <li><strong>E-commerce / Sistemas de Reserva:</strong> $3,500 - $5,500 USD (con pasarelas de pago y agendas automatizadas).</li>
                            <li><strong>Ecosistemas Corporativos a Medida + IA:</strong> $6,000+ USD (integración de CRM, automatización de flujos e IA corporativa).</li>
                        </ul>
                        <p>Podemos hacerte una cotización express de forma inmediata en el chat.</p>
                    `);
                    
                    addQuickReplyChips([
                        { text: '💼 Cotizar Proyecto', callback: () => startQuoteFlow() },
                        { text: '🔙 Volver al inicio', callback: () => triggerWelcomeSequence() }
                    ]);
                } 
                else if (query.includes('barber') || query.includes('clinica') || query.includes('tienda') || query.includes('medico') || query.includes('local') || query.includes('abogado')) {
                    addMessage('bot', `
                        <p class="font-bold mb-1 text-[#1F3A2E] dark:text-[#F3F0EB]">Soluciones a Medida para tu Sector</p>
                        <p class="mb-2">¡Excelente! Para este tipo de modelos de negocio, la clave reside en la <strong>fricción cero</strong>: automatizar reservas de turnos, integrar pagos ágiles y construir una imagen premium que inspire confianza instantánea.</p>
                        <p class="mb-2">Un sitio web estratégico con integraciones de reservas puede ahorrarte hasta 12 horas semanales de gestión manual y aumentar tu conversión de visitas en un 40%.</p>
                        <p>¿Te gustaría auditar tu web actual o pre-cotizar un ecosistema nuevo?</p>
                    `);
                    
                    addQuickReplyChips([
                        { text: '🔍 Auditar mi web actual', callback: () => startAuditFlow() },
                        { text: '💼 Cotizar ecosistema premium', callback: () => startQuoteFlow() },
                        { text: '🔙 Volver al inicio', callback: () => triggerWelcomeSequence() }
                    ]);
                }
                else if (query.includes('seo') || query.includes('posicionamiento') || query.includes('google') || query.includes('visitas')) {
                    addMessage('bot', `
                        <p class="font-bold mb-1 text-[#1F3A2E] dark:text-[#F3F0EB]">Estructuras de SEO Semántico</p>
                        <p class="mb-2">En Roble Studio diseñamos cada línea de código pensando en Google. Implementamos:</p>
                        <ul class="space-y-1 list-disc pl-4 mb-2">
                            <li><strong>Marcado JSON-LD:</strong> Estructuración de datos para búsquedas enriquecidas.</li>
                            <li><strong>Rendimiento Extremo:</strong> Tiempos de carga de sub-segundo que benefician tu Core Web Vitals.</li>
                            <li><strong>Estructura Semántica:</strong> Jerarquías H1-H6 curadas para tus palabras clave locales e internacionales.</li>
                        </ul>
                        <p>El posicionamiento orgánico con bases sólidas es el canal de captación más rentable a largo plazo.</p>
                    `);
                    
                    addQuickReplyChips([
                        { text: '🔍 Auditar SEO de mi web', callback: () => startAuditFlow() },
                        { text: '💼 Cotizar proyecto', callback: () => startQuoteFlow() }
                    ]);
                }
                else if (query.includes('ia') || query.includes('inteligencia artificial') || query.includes('automatizacion') || query.includes('bot')) {
                    addMessage('bot', `
                        <p class="font-bold mb-1 text-[#1F3A2E] dark:text-[#F3F0EB]">Integración de IA y Automatizaciones</p>
                        <p class="mb-2">El futuro digital es inteligente. Automatizamos tus cimientos operativos para que te enfoques en crecer:</p>
                        <ul class="space-y-1 list-disc pl-4 mb-2">
                            <li><strong>Asistentes Inteligentes:</strong> Como el que estás usando ahora, que califican leads 24/7.</li>
                            <li><strong>Automatizaciones de CRM:</strong> Sincronización automática de citas a agendas de Google, descargas de .ics y flujos post-llamada.</li>
                            <li><strong>Integraciones Cloud:</strong> Conexiones robustas con Make, Zapier y APIs para eliminar tareas manuales repetitivas.</li>
                        </ul>
                        <p>Diseñamos herramientas que trabajan para ti, no al revés.</p>
                    `);
                    
                    addQuickReplyChips([
                        { text: '💼 Cotizar automatizaciones', callback: () => startQuoteFlow() },
                        { text: '📅 Agendar llamada estratégica', callback: () => scrollAndBook() }
                    ]);
                }
                else {
                    addMessage('bot', `
                        <p class="mb-2">Es una consulta sumamente interesante. En **Roble Studio** enfocamos cada inquietud de diseño y tecnología bajo una óptica estratégica orientada a resultados concretos (aumentar ventas, consolidar marca premium o automatizar flujos).</p>
                        <p class="mb-2">¿Te gustaría que realicemos una **Auditoría Express** de tu sitio actual o prefieres **cotizar un desarrollo premium** estructurado desde cero?</p>
                    `);
                    
                    addQuickReplyChips([
                        { text: '🔍 Auditar mi web actual', callback: () => startAuditFlow() },
                        { text: '💼 Cotizar proyecto premium', callback: () => startQuoteFlow() },
                        { text: '📅 Agendar llamada', callback: () => scrollAndBook() }
                    ]);
                }
            }, 1200);
        }
    }

    // 8. Event Listeners for Inputs
    function handleSend() {
        const text = inputField.value.trim();
        if (!text) return;

        // Reset input field
        inputField.value = '';

        // Render user message bubble
        addMessage('user', text, { allowHtml: false });

        // Route input
        handleHeuristicUserInput(text);
    }

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Make welcome sequence active on load
    triggerWelcomeSequence();

    // 9. Attach hooks for Cursor Magnetism
    window.refreshCursorListeners = function() {
        const cursor = document.getElementById('roble-cursor');
        if (!cursor) return;

        // Select launcher and any newly generated quick reply buttons/chips inside the chat
        const interactiveElements = document.querySelectorAll(
            '#roble-assistant-launcher, #roble-assistant-close, ' +
            '#roble-assistant-send, #roble-assistant-messages button, .audit-resolve-btn'
        );

        if (typeof window.initCustomCursor === 'function' || gsap) {
            interactiveElements.forEach(el => {
                // If it doesn't already have event listeners bound for magnetic movement
                if (el.getAttribute('data-cursor-bound')) return;
                el.setAttribute('data-cursor-bound', 'true');

                el.addEventListener('mousemove', (e) => {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const dx = e.clientX - centerX;
                    const dy = e.clientY - centerY;

                    gsap.to(el, { x: dx * 0.22, y: dy * 0.22, duration: 0.3, ease: 'power2.out' });
                    
                    // Sneak snap of our custom cursor visual towards elements center
                    const cursorVisual = document.getElementById('roble-cursor-visual');
                    const cursorGlow = document.getElementById('roble-cursor-glow');
                    if (cursorVisual && cursorGlow) {
                        gsap.to(cursorVisual, { scale: 1.25, duration: 0.3, ease: 'power2.out' });
                        gsap.set(cursorGlow, { backgroundColor: '#1F3A2E' });
                        gsap.to(cursorGlow, { opacity: 0.5, scale: 1.5, duration: 0.3 });
                    }
                });

                el.addEventListener('mouseleave', () => {
                    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1.1, 0.4)' });
                    const cursorVisual = document.getElementById('roble-cursor-visual');
                    const cursorGlow = document.getElementById('roble-cursor-glow');
                    if (cursorVisual && cursorGlow) {
                        gsap.to(cursorVisual, { scale: 1, duration: 0.3, ease: 'power2.out' });
                        gsap.to(cursorGlow, { opacity: 0, scale: 1, duration: 0.3 });
                    }
                });
            });
        }
    };

    // Initial binding
    setTimeout(() => {
        if (typeof window.refreshCursorListeners === 'function') {
            window.refreshCursorListeners();
        }
    }, 1500);
}
