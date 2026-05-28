// ==========================================================================
// ROBLE STUDIO - PRINCIPAL JAVASCRIPT
// Crafted with Organic Precision and State-of-the-Art Interactive Logic
// ==========================================================================

import { initCustomCursor } from './cursor.js';
import { initRobleAssistant } from './assistant.js';
import { initBooking } from './booking.js';

// Force scroll to top on reload/refresh to ensure users always start at the beginning of the page
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);
    window.addEventListener('load', () => {
        window.scrollTo(0, 0);
    });

    // Inicializar Cursor Custom Premium (Semilla de Roble)
    initCustomCursor();

    // Inicializar Asistente de IA Premium (Roble Assistant & Auditoría Web)
    initRobleAssistant();

    // ==========================================
    // 1. IMMERSIVE VIDEO CINEMA MODE HANDLER
    // ==========================================
    const heroVideo = document.getElementById('hero-video');
    const heroRevealContent = document.getElementById('hero-reveal-content');
    
    if (heroVideo) {
        let justUnmuted = false;

        const skipIntro = () => {
            heroVideo.pause();
            
            // Smoothly cross-fade from playing video to static cover image
            heroVideo.classList.add('opacity-0');
            const heroStaticImg = document.getElementById('hero-static-img');
            if (heroStaticImg) {
                heroStaticImg.classList.remove('opacity-0');
                heroStaticImg.classList.add('opacity-100');
            }

            const videoPlayOverlay = document.getElementById('video-play-overlay');
            if (videoPlayOverlay) {
                videoPlayOverlay.remove();
            }

            const heroVideoWrapper = document.getElementById('hero-video-wrapper');
            if (heroVideoWrapper) {
                // Remove initial layout & styling classes
                heroVideoWrapper.classList.remove(
                    'w-full', 'max-w-3xl', 'aspect-[16/9]', 
                    'rounded-3xl', 'rounded-none', 'rounded-[0px]',
                    'border-outline-variant/20', 'dark:border-outline-variant/10',
                    'border-outline-variant/10', 'dark:border-outline-variant/5',
                    'border-[0px]', 'border-secondary/0', 'shadow-none', 'shadow-sm'
                );
                // Add transitioned styling classes (perfectly elegant circular oak badge)
                heroVideoWrapper.classList.add(
                    'w-[200px]', 'h-[200px]', 'md:w-[280px]', 'md:h-[280px]', 
                    'rounded-full', 'border-secondary/20', 'shrink-0', 'md:mx-0'
                );
            }
            if (heroRevealContent) {
                heroRevealContent.classList.remove('md:w-0', 'opacity-0', 'max-h-0', 'pointer-events-none');
                heroRevealContent.classList.add('md:w-[60%]', 'opacity-100', 'max-h-[800px]', 'pointer-events-auto');
                
                // Allow natural height expansion and prevent vertical clipping once transition is done
                setTimeout(() => {
                    heroRevealContent.style.maxHeight = 'none';
                    heroRevealContent.classList.remove('overflow-hidden');
                }, 1000);
            }
            // Remove cinema mode to restore page background, nav, and scrolling
            document.body.classList.remove('video-playing');
        };

        // When video finishes playing, freeze on last frame and reveal title content
        heroVideo.addEventListener('ended', skipIntro);
        
        // Safety net: in case of video loading error, skip intro smoothly
        heroVideo.addEventListener('error', skipIntro);

        // Saltar Intro Button click handler
        const skipIntroBtn = document.getElementById('skip-intro-btn');
        if (skipIntroBtn) {
            skipIntroBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                skipIntro();
            });
        }

        // Sync Play/Pause status of the video with the custom play overlay
        const videoPlayOverlay = document.getElementById('video-play-overlay');
        
        if (videoPlayOverlay) {
            heroVideo.addEventListener('pause', () => {
                if (document.body.classList.contains('video-playing')) {
                    videoPlayOverlay.classList.remove('opacity-0', 'pointer-events-none');
                }
            });
            
            heroVideo.addEventListener('play', () => {
                if (document.body.classList.contains('video-playing')) {
                    videoPlayOverlay.classList.add('opacity-0', 'pointer-events-none');
                }
            });
        }

        // Toggle Play/Pause when clicking the video wrapper (during Cinema Mode)
        const heroVideoWrapper = document.getElementById('hero-video-wrapper');
        if (heroVideoWrapper) {
            heroVideoWrapper.addEventListener('click', (e) => {
                if (document.body.classList.contains('video-playing')) {
                    if (justUnmuted) {
                        return; // Do nothing, unmuting handled it
                    }
                    if (heroVideo.paused) {
                        heroVideo.play().catch(err => console.log("Error al reproducir video tras click:", err));
                    } else {
                        heroVideo.pause();
                    }
                }
            });
        }

        // Programmatic Autoplay (Muted for browser compliance and user experience)
        heroVideo.muted = true;
        heroVideo.play().catch(e => console.log("Fallo al reproducir silenciado:", e));
    }

    // ==========================================
    // 2. LIGHT / DARK THEME TOGGLE (CIRCULAR TRANSITION)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    
    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            themeToggleIcon.textContent = 'light_mode';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleIcon.textContent = 'dark_mode';
            localStorage.setItem('theme', 'light');
        }
    };
    
    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setTheme(true);
    } else {
        setTheme(false);
    }
    
    // Circular expansion toggle transition
    themeToggleBtn.addEventListener('click', (e) => {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Create circle reveal container
        const circle = document.createElement('div');
        circle.className = `theme-reveal-circle ${isDark ? 'bg-surface' : 'bg-primary'}`;
        
        // Coordinates of click event (fallback to viewport center)
        const x = e.clientX || window.innerWidth / 2;
        const y = e.clientY || window.innerHeight / 2;
        
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        
        // Calculate max radius to cover the entire viewport mathematically
        const maxRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        
        document.body.appendChild(circle);
        
        // Force Reflow
        circle.offsetWidth;
        
        // Trigger Circular Scaling
        circle.style.transform = `translate(-50%, -50%) scale(${(maxRadius / 2) + 20})`;
        circle.classList.add('reveal-active');
        
        setTimeout(() => {
            setTheme(!isDark);
            
            // Fade out circular overlay smoothly
            circle.style.opacity = '0';
            circle.style.transition = 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease-out';
            
            setTimeout(() => {
                circle.remove();
            }, 350);
        }, 450);
    });

    // ==========================================
    // 3. SERVICE DETAIL MODALS
    // ==========================================
    const serviceModal = document.getElementById('service-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.getElementById('close-modal');
    const serviceCards = document.querySelectorAll('.service-card');
    
    const servicesData = {
        diseno: {
            title: "Diseño Web Estratégico",
            icon: "web",
            desc: "La estética al servicio del objetivo de negocio. No diseñamos páginas decorativas; creamos flujos de información ordenados que conducen al usuario paso a paso hacia el contacto.",
            bulletTitle: "Qué incluye el alcance:",
            bullets: [
                "Investigación profunda de User Personas y arquitectura de información.",
                "Wireframes estructurales de alta conversión.",
                "Identidad visual y maquetación maquetada a medida en Figma.",
                "Creación del Sistema de Diseño Roble (tipografía, colores, guías).",
                "Prototipos interactivos previos a programación."
            ]
        },
        desarrollo: {
            title: "Desarrollo Web Robusto",
            icon: "code",
            desc: "Programación rápida, impecable y de gran rendimiento. Nuestro código está estructurado bajo las mejores prácticas internacionales, garantizando escalabilidad técnica y velocidad extrema de carga.",
            bulletTitle: "Ventajas técnicas incorporadas:",
            bullets: [
                "Código HTML5 y JS semántico y de carga ultrarrápida (<1s FCP).",
                "Responsive Design total (optimizado de manera independiente para móviles).",
                "Optimización extrema para Google Core Web Vitals.",
                "SEO Técnico estructurado nativo (datos estructurados JSON-LD).",
                "Seguridad SSL de grado empresarial e integraciones API robustas."
            ]
        },
        ia: {
            title: "Automatización con IA",
            icon: "smart_toy",
            desc: "Transformamos tu sitio en un empleado que trabaja 24/7 sin descanso. Integramos soluciones avanzadas de Inteligencia Artificial que capturan datos, resuelven dudas y automatizan tus flujos de venta.",
            bulletTitle: "Módulos de IA y Automatización:",
            bullets: [
                "Chatbots personalizados y entrenados con tu catálogo o base de conocimiento.",
                "Sistemas automatizados de agendamiento (vinculados a Google Calendar).",
                "Respuestas a leads cualificados instantáneas por email o WhatsApp.",
                "Flujos de nutrición integrados con tu CRM preferido (Hubspot, Salesforce, etc.)."
            ]
        },
        seo: {
            title: "Posicionamiento SEO",
            icon: "search",
            desc: "Hacemos que tus clientes ideales te encuentren en Google antes que a tus competidores. Nuestra metodología no persigue tráfico vacío; atraemos intenciones de búsqueda con alto potencial de compra.",
            bulletTitle: "Nuestra estrategia de SEO:",
            bullets: [
                "Estudio minucioso de palabras clave con intención comercial clara.",
                "Arquitectura técnica interna óptima y enlazado inteligente.",
                "Creación y optimización de contenido premium para responder consultas clave.",
                "Optimización de metadatos, etiquetas semánticas y jerarquías.",
                "Reporte mensual de rendimiento y posicionamiento en el ranking."
            ]
        },
        mantenimiento: {
            title: "Mantenimiento & Soporte Premium",
            icon: "build",
            desc: "La solidez del roble requiere cuidado continuo. Nos encargamos de toda la complejidad técnica diaria de tu sitio para que tú te enfoques exclusivamente en operar tu negocio.",
            bulletTitle: "Alcance del soporte proactivo:",
            bullets: [
                "Copias de seguridad diarias automatizadas en la nube.",
                "Auditorías semanales de velocidad de carga y rendimiento de conversión.",
                "Soporte prioritario técnico por email y chat ante cualquier eventualidad.",
                "Monitoreo 24/7 contra vulnerabilidades y ciberataques.",
                "Pequeñas actualizaciones estéticas y de contenido mensuales incluidas."
            ]
        }
    };
    
    const hideServiceModal = () => {
        serviceModal.classList.add('opacity-0', 'pointer-events-none');
        serviceModal.querySelector('.border').classList.remove('scale-100');
        serviceModal.querySelector('.border').classList.add('scale-95');
    };

    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-service');
            const data = servicesData[key];
            if (data) {
                modalContent.innerHTML = `
                    <div class="flex items-center gap-3.5 mb-6">
                        <div class="w-12 h-12 bg-secondary/15 rounded-lg flex items-center justify-center text-secondary">
                            <span class="material-symbols-outlined text-2xl font-bold">${data.icon}</span>
                        </div>
                        <h3 class="font-headline-md text-2xl text-primary dark:text-inverse-on-surface font-bold leading-tight">${data.title}</h3>
                    </div>
                    <p class="font-body-md text-on-surface-variant dark:text-inverse-primary/80 mb-6 text-sm leading-relaxed">${data.desc}</p>
                    <h4 class="font-label-md text-xs font-bold text-primary dark:text-secondary-fixed mb-3 uppercase tracking-wider">${data.bulletTitle}</h4>
                    <ul class="space-y-2.5">
                        ${data.bullets.map(bullet => `
                            <li class="flex items-start gap-2.5 text-sm text-on-surface-variant dark:text-inverse-primary/70">
                                <svg class="w-4 h-4 text-secondary dark:text-secondary-fixed shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                                </svg>
                                <span>${bullet}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="mt-8 pt-6 border-t border-outline-variant/20 dark:border-outline-variant/10">
                        <a href="#contacto" id="modal-cta" class="w-full inline-block text-center bg-[#db790a] hover:bg-[#db790a]/90 text-white font-label-md text-sm font-bold py-3 rounded-lg shadow-md transition-all">Agendar llamada estratégica</a>
                    </div>
                `;
                
                serviceModal.classList.remove('opacity-0', 'pointer-events-none');
                serviceModal.querySelector('.border').classList.remove('scale-95');
                serviceModal.querySelector('.border').classList.add('scale-100');
                
                // Close modal on CTA click
                document.getElementById('modal-cta').addEventListener('click', () => {
                    hideServiceModal();
                });
            }
        });
    });
    
    closeModal.addEventListener('click', hideServiceModal);
    serviceModal.addEventListener('click', (e) => {
        if (e.target === serviceModal) hideServiceModal();
    });

    // Close modal on Esc press (A11y enhancement)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideServiceModal();
            const overlay = document.getElementById('mobile-menu-overlay');
            if (overlay && overlay.classList.contains('opacity-100')) {
                // close mobile menu too
                overlay.classList.remove('opacity-100', 'pointer-events-auto');
                overlay.classList.add('opacity-0', 'pointer-events-none');
                document.getElementById('mobile-menu-icon').textContent = 'menu';
                document.body.classList.remove('overflow-hidden');
            }
        }
    });

    // ==========================================
    // 4. INTERACTIVE METHODOLOGY STEPS
    // ==========================================
    const stepsData = {
        1: {
            title: "Descubrimiento Comercial Profundo",
            meta: "Fase 1 • Duración: Semana 1",
            desc: "Nos sumergimos en las raíces de tu negocio. Analizamos detalladamente tu propuesta de valor, investigamos a tu competencia premium y estudiamos las objeciones y necesidades de tu cliente ideal.",
            deliverables: "Auditoría inicial de marca, mapa de dolores de clientes y especificación técnica de objetivos de conversión."
        },
        2: {
            title: "Estructura Persuasiva & Estrategia",
            meta: "Fase 2 • Duración: Semanas 1-2",
            desc: "Trazamos la arquitectura de la información. Definimos los llamados a la acción (CTAs) idóneos y planificamos las automatizaciones de Inteligencia Artificial que capturarán consultas y simplificarán tu agenda de manera natural.",
            deliverables: "Mapa de navegación estratégico, diagrama de flujo de embudo y estructura jerárquica de contenidos."
        },
        3: {
            title: "Diseño Táctil y Prototipado Exclusivo",
            meta: "Fase 3 • Duración: Semanas 2-3",
            desc: "Comienza la creación visual bajo la guía de 'Organic Tech'. Diseñamos interfaces fluidas, de alta gama y gran legibilidad en Figma. Cada decisión tipográfica, de color y micro-animación responde a la persuasión.",
            deliverables: "Prototipo de alta fidelidad interactivo de escritorio y móviles en Figma y Sistema de Diseño de marca."
        },
        4: {
            title: "Código de Alto Rendimiento y Estructura",
            meta: "Fase 4 • Duración: Semanas 3-5",
            desc: "La ingeniería toma el relevo. Codificamos tu sitio web usando las tecnologías más limpias y rápidas. Nos enfocamos en una velocidad extrema de carga móvil y en estructurar integraciones de IA robustas y libres de fricciones.",
            deliverables: "Plataforma de desarrollo en vivo, optimización SEO técnica e integración y testeo de APIs y calendarios."
        },
        5: {
            title: "Garantía de Calidad y Lanzamiento Seguro",
            meta: "Fase 5 • Duración: Semana 5-6",
            desc: "Evaluación exhaustiva. Testeamos minuciosamente el sitio en múltiples navegadores y resoluciones de pantalla para asegurar una respuesta visual perfecta. Configuramos redirecciones de seguridad, SSL y desplegamos con cero caídas.",
            deliverables: "Checklist de QA certificado, migración final de servidor, activación de dominio SSL y entrega del sitio."
        },
        6: {
            title: "Medición, Retorno de Inversión y Escalado",
            meta: "Fase 6 • Soporte Continuo",
            desc: "El lanzamiento es solo el inicio del roble. Analizamos el comportamiento real de los visitantes en caliente. Hacemos micro-ajustes visuales para potenciar la conversión y refinamos las respuestas automatizadas de la IA.",
            deliverables: "Panel de analíticas de usuario activo, informe inicial de captación y optimizaciones continuas de conversión."
        }
    };
    
    const stepBtns = document.querySelectorAll('.step-btn');
    const stepDetailContent = document.getElementById('step-detail-content');
    const progressLine = document.getElementById('timeline-progress');
    
    const selectStep = (stepNumber) => {
        const data = stepsData[stepNumber];
        
        // Update button visual states and accessibility indicators
        stepBtns.forEach((btn, idx) => {
            const btnNum = idx + 1;
            const numCircle = btn.querySelector('.step-num');
            
            if (btnNum < stepNumber) {
                numCircle.className = "step-num w-14 h-14 rounded-full bg-secondary text-white border-2 border-secondary flex items-center justify-center font-headline-md text-lg relative transition-all duration-300 font-bold shadow-md";
                btn.querySelector('span').className = "mt-3 text-xs md:text-sm font-semibold tracking-wider uppercase text-inverse-primary/80 transition-colors";
                btn.setAttribute('aria-selected', 'false');
            } else if (btnNum === stepNumber) {
                numCircle.className = "step-num w-14 h-14 rounded-full bg-[#db790a] text-white border-2 border-[#db790a] flex items-center justify-center font-headline-md text-lg relative transition-all duration-300 font-bold shadow-lg scale-110";
                btn.querySelector('span').className = "mt-3 text-xs md:text-sm font-bold tracking-wider uppercase text-white transition-colors";
                btn.setAttribute('aria-selected', 'true');
            } else {
                numCircle.className = "step-num w-14 h-14 rounded-full bg-surface text-primary border-2 border-surface group-hover:border-secondary flex items-center justify-center font-headline-md text-lg relative transition-all duration-300 font-bold";
                btn.querySelector('span').className = "mt-3 text-xs md:text-sm font-semibold tracking-wider uppercase text-inverse-primary/60 group-hover:text-surface transition-colors";
                btn.setAttribute('aria-selected', 'false');
            }
        });
        
        // Update horizontal progress line width on desktop
        if (progressLine) {
            const percent = ((stepNumber - 1) / 5) * 100;
            progressLine.style.width = `${percent}%`;
        }
        
        // Animate content shift inside panel
        stepDetailContent.classList.add('opacity-0', 'translate-y-2');
        
        setTimeout(() => {
            stepDetailContent.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                    <h4 class="font-headline-md text-2xl text-surface font-bold leading-tight">${data.title}</h4>
                    <span class="bg-secondary/35 text-secondary-fixed-dim text-xs font-bold px-3 py-1.5 rounded-full border border-secondary/30">${data.meta}</span>
                </div>
                <p class="text-inverse-primary/80 text-sm leading-relaxed mb-6">${data.desc}</p>
                <div class="border-t border-outline-variant/10 pt-4 flex flex-col md:flex-row md:items-center gap-2 text-xs">
                    <span class="font-label-md text-secondary font-bold uppercase tracking-wider">Entregable clave:</span>
                    <span class="text-surface font-medium">${data.deliverables}</span>
                </div>
            `;
            stepDetailContent.classList.remove('opacity-0', 'translate-y-2');
        }, 150);
    };
    
    // Set Step 1 as active initially
    selectStep(1);
    
    stepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const num = parseInt(btn.getAttribute('data-step'));
            selectStep(num);
        });
    });

    // ==========================================
    // 5. TESTIMONIALS SLIDER / CAROUSEL
    // ==========================================
    const testimonialTrack = document.getElementById('testimonial-track');
    const dotBtns = document.querySelectorAll('.dot-btn');
    
    if (testimonialTrack && dotBtns.length > 0) {
        const slides = testimonialTrack.children;
        const totalSlides = slides.length;
        const prevTestBtn = document.getElementById('prev-test');
        const nextTestBtn = document.getElementById('next-test');
        let currentSlideIdx = 0;
        
        const updateSlider = (idx) => {
            currentSlideIdx = idx;
            testimonialTrack.style.transform = `translateX(-${idx * 100}%)`;
            
            // Update dots
            dotBtns.forEach((dot, dotIdx) => {
                if (dotIdx === idx) {
                    dot.classList.remove('bg-surface/30');
                    dot.classList.add('bg-secondary', 'scale-110');
                    dot.setAttribute('aria-current', 'true');
                } else {
                    dot.classList.remove('bg-secondary', 'scale-110');
                    dot.classList.add('bg-surface/30');
                    dot.removeAttribute('aria-current');
                }
            });
        };
        
        const nextTestimonial = () => {
            let nextIdx = currentSlideIdx + 1;
            if (nextIdx >= totalSlides) nextIdx = 0;
            updateSlider(nextIdx);
        };
        
        const prevTestimonial = () => {
            let prevIdx = currentSlideIdx - 1;
            if (prevIdx < 0) prevIdx = totalSlides - 1;
            updateSlider(prevIdx);
        };
        
        nextTestBtn.addEventListener('click', nextTestimonial);
        prevTestBtn.addEventListener('click', prevTestimonial);
        
        dotBtns.forEach(dot => {
            dot.addEventListener('click', () => {
                const slideNum = parseInt(dot.getAttribute('data-slide'));
                updateSlider(slideNum);
            });
        });

        // Keyboard navigation for testimonials (A11y)
        window.addEventListener('keydown', (e) => {
            // Check if user is focusing inside testimonial track or controls
            const isInside = testimonialTrack.contains(document.activeElement) || 
                             document.getElementById('prev-test').contains(document.activeElement) || 
                             document.getElementById('next-test').contains(document.activeElement);
            if (isInside) {
                if (e.key === 'ArrowRight') nextTestimonial();
                if (e.key === 'ArrowLeft') prevTestimonial();
            }
        });
        
        // Set initial testimonial state
        updateSlider(0);
        
        // Auto slide every 10 seconds
        setInterval(nextTestimonial, 10000);
    }

    // ==========================================
    // 6. INTERACTIVE BOOKING CALENDAR WIDGET
    // ==========================================
    initBooking();
    /*
    
    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDateContext.setMonth(currentDateContext.getMonth() - 1);
            loadCalendarDays();
            timeSlotsContainer.innerHTML = '<p class="text-xs text-on-surface-variant dark:text-inverse-primary/50 italic col-span-full py-4 text-center">Selecciona un día para ver horas</p>';
            calendarContinueBtn.disabled = true;
        });
        
        nextMonthBtn.addEventListener('click', () => {
            currentDateContext.setMonth(currentDateContext.getMonth() + 1);
            loadCalendarDays();
            timeSlotsContainer.innerHTML = '<p class="text-xs text-on-surface-variant dark:text-inverse-primary/50 italic col-span-full py-4 text-center">Selecciona un día para ver horas</p>';
            calendarContinueBtn.disabled = true;
        });
    }
    
    // Flow: Step 1 to Step 2
    if (calendarContinueBtn) {
        calendarContinueBtn.addEventListener('click', () => {
            if (selectedDate && selectedTime) {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = selectedDate.toLocaleDateString('es-ES', options);
                
                // Capitalize weekday first letter
                const displayDateStr = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
                const dateTimeString = `${displayDateStr} a las ${selectedTime} hs`;
                
                summaryDatetime.textContent = dateTimeString;
                successSummaryDate.textContent = `${dateTimeString} (CDMX) • Google Meet`;
                
                step1Container.classList.add('hidden');
                step2Container.classList.remove('hidden');
            }
        });
    }
    
    // Flow: Step 2 to Step 1 (Back button)
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            step2Container.classList.add('hidden');
            step1Container.classList.remove('hidden');
        });
    }
    
    // Helper to format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatGCalDate = (date, time) => {
        const [hours, minutes] = time.split(':');
        const eventDate = new Date(date);
        eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const pad = (num) => String(num).padStart(2, '0');
        
        const y = eventDate.getFullYear();
        const m = pad(eventDate.getMonth() + 1);
        const d = pad(eventDate.getDate());
        const hh = pad(eventDate.getHours());
        const mm = pad(eventDate.getMinutes());
        const ss = pad(eventDate.getSeconds());
        
        return `${y}${m}${d}T${hh}${mm}${ss}`;
    };

    // Flow: Form Submission (Step 2 to Step 3 with real integrations)
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const clientNameVal = document.getElementById('client-name').value;
            const clientEmailVal = document.getElementById('client-email').value;
            const clientBusinessVal = document.getElementById('client-business').value;
            const clientWebsiteVal = document.getElementById('client-website') ? document.getElementById('client-website').value : '';
            const clientGoalVal = document.getElementById('client-goal').value;
            
            const bookingData = {
                name: clientNameVal,
                email: clientEmailVal,
                business: clientBusinessVal,
                website: clientWebsiteVal,
                goal: clientGoalVal,
                date: selectedDate.toISOString(),
                time: selectedTime
            };
            
            // Store in LocalStorage
            localStorage.setItem('roble_studio_booking', JSON.stringify(bookingData));
            
            // Dispatch Webhook (POST API submission) - Easily customizable endpoint
            // Defaulting to a robust fallback logging to confirm webhook dispatcher is active
            const webhookUrl = import.meta.env.VITE_BOOKING_WEBHOOK_URL || '';
            console.log("Despachando cita al Webhook:", bookingData);
            
            fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors', // handle cross-origin gracefully
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            }).then(() => {
                console.log("Cita despachada exitosamente al webhook.");
            }).catch(err => {
                console.warn("Fallo de conexión al webhook (esperado en local):", err);
            });
            
            step2Container.classList.add('hidden');
            step3Container.classList.remove('hidden');
            
            // Load active reservation banner details immediately
            showBookingBanner(bookingData);
        });
    }
    
    // Finish workflow
    const resetBookingStepToStart = () => {
        step3Container.classList.add('hidden');
        step1Container.classList.remove('hidden');
        
        selectedDate = null;
        selectedTime = null;
        if (calendarContinueBtn) {
            calendarContinueBtn.disabled = true;
        }
        if (timeSlotsContainer) {
            timeSlotsContainer.innerHTML = '<p class="text-xs text-on-surface-variant dark:text-inverse-primary/50 italic col-span-full py-4 text-center">Selecciona un día para ver horas</p>';
        }
        
        currentDateContext = new Date();
        loadCalendarDays();
    };
    
    if (finishBtn) {
        finishBtn.addEventListener('click', resetBookingStepToStart);
    }
    
    // NATIVE DIRECT CALENDAR INTEGRATIONS
    // 1. Google Calendar Integration
    const googleCalBtn = document.getElementById('success-google-cal');
    if (googleCalBtn) {
        googleCalBtn.addEventListener('click', () => {
            const stored = localStorage.getItem('roble_studio_booking');
            if (stored) {
                const data = JSON.parse(stored);
                const startStr = formatGCalDate(data.date, data.time);
                
                // End date is +30 minutes
                const endDate = new Date(data.date);
                const [hours, minutes] = data.time.split(':');
                endDate.setHours(parseInt(hours), parseInt(minutes) + 30, 0, 0);
                
                const pad = (num) => String(num).padStart(2, '0');
                const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
                
                const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Llamada+Estrat%C3%A9gica+•+Roble+Studio&dates=${startStr}/${endStr}&details=Hola+${encodeURIComponent(data.name)}.%0ATu+Llamada+Estrat%C3%A9gica+con+Roble+Studio+ha+sido+confirmada.%0A%0ADetalles+del+contacto:%0A-+Nombre:+${encodeURIComponent(data.name)}%0A-+Negocio:+${encodeURIComponent(data.business)}%0A-+Objetivo:+${encodeURIComponent(data.goal)}%0A%0ANos+conectaremos+a+trav%C3%A9s+de+Google+Meet.&location=Google+Meet&trp=true&sprop=website:roblestudio.com`;
                
                window.open(gCalUrl, '_blank');
            }
        });
    }

    // 2. iCalendar (.ics) File Generator
    // Let's dynamically inject a beautiful "Añadir a Apple/Outlook" ICS button inside Step 3 for maximum premium value!
    const initIcsDownload = () => {
        const step3BtnsContainer = document.querySelector('#booking-step-3 > div.flex');
        if (step3BtnsContainer) {
            // Check if button already exists to prevent duplicate injections
            if (document.getElementById('success-ics-download')) return;

            const icsBtn = document.createElement('button');
            icsBtn.id = 'success-ics-download';
            icsBtn.className = 'flex-grow bg-surface-container hover:bg-surface-container-high dark:bg-primary-container dark:hover:bg-primary/50 text-primary dark:text-inverse-on-surface py-3 rounded-lg font-label-md text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 border border-outline-variant/30 dark:border-outline-variant/15';
            icsBtn.innerHTML = '<span class="material-symbols-outlined text-xs">download</span> Apple / Outlook (.ics)';
            
            icsBtn.addEventListener('click', () => {
                const stored = localStorage.getItem('roble_studio_booking');
                if (stored) {
                    const data = JSON.parse(stored);
                    const startStr = formatGCalDate(data.date, data.time);
                    
                    const endDate = new Date(data.date);
                    const [hours, minutes] = data.time.split(':');
                    endDate.setHours(parseInt(hours), parseInt(minutes) + 30, 0, 0);
                    const pad = (num) => String(num).padStart(2, '0');
                    const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
                    
                    // Build standard .ics format string
                    const icsContent = [
                        'BEGIN:VCALENDAR',
                        'VERSION:2.0',
                        'PRODID:-//Roble Studio//Booking Widget//ES',
                        'BEGIN:VEVENT',
                        `UID:${Date.now()}@roblestudio.com`,
                        `DTSTAMP:${startStr}Z`,
                        `DTSTART:${startStr}`,
                        `DTEND:${endStr}`,
                        'SUMMARY:Llamada Estratégica • Roble Studio',
                        `DESCRIPTION:Hola ${data.name}. Tu Sesión de Descubrimiento con Roble Studio está agendada. Negocio: ${data.business}. Principal objetivo: ${data.goal}`,
                        'LOCATION:Google Meet',
                        'END:VEVENT',
                        'END:VCALENDAR'
                    ].join('\r\n');
                    
                    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'llamada_estrategica_roble_studio.ics';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
            
            // Insert it before the "Entendido" button
            step3BtnsContainer.insertBefore(icsBtn, step3BtnsContainer.lastElementChild);
        }
    };

    // Listen for DOM alterations to ensure .ics button gets mounted when booking-step-3 is revealed
    const observerBooking = new MutationObserver(() => {
        if (step3Container && !step3Container.classList.contains('hidden')) {
            initIcsDownload();
        }
    });
    if (step3Container) {
        observerBooking.observe(step3Container.parentElement, { attributes: true, subtree: true });
    }
    
    // Manage Stored Reservation Banner
    const showBookingBanner = (data) => {
        if (data && bannerText && bannerContainer) {
            const options = { day: 'numeric', month: 'short' };
            const formatted = new Date(data.date).toLocaleDateString('es-ES', options);
            
            bannerText.textContent = `¡Hola ${data.name}! Tienes una llamada agendada: ${formatted} a las ${data.time} hs.`;
            bannerContainer.classList.remove('hidden');
        }
    };
    
    const checkStoredBooking = () => {
        const stored = localStorage.getItem('roble_studio_booking');
        if (stored) {
            const data = JSON.parse(stored);
            showBookingBanner(data);
        } else if (bannerContainer) {
            bannerContainer.classList.add('hidden');
        }
    };
    
    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que deseas cancelar tu llamada estratégica con Roble Studio?")) {
                localStorage.removeItem('roble_studio_booking');
                checkStoredBooking();
                resetBookingStepToStart();
            }
        });
    }
    
    // Initialize Calendar Days on startup
    currentDateContext = new Date();
    loadCalendarDays();
    checkStoredBooking();

    */
    // ==========================================
    // 7. SCROLL-TRIGGERED ANIMATIONS
    // ==========================================
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        scrollObserver.observe(el);
    });

    // ==========================================
    // 8. PORTFOLIO FILTERING SYSTEM
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterButtons.length > 0 && projectCards.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Reset active state for all buttons
                filterButtons.forEach(b => {
                    b.classList.remove('bg-secondary', 'text-surface', 'dark:bg-secondary-fixed', 'dark:text-primary', 'active', 'shadow-sm');
                    b.classList.add('bg-surface-container', 'text-primary', 'dark:bg-primary-container/40', 'dark:text-inverse-primary', 'shadow-none');
                });
                // Set active state on target button
                btn.classList.remove('bg-surface-container', 'text-primary', 'dark:bg-primary-container/40', 'dark:text-inverse-primary', 'shadow-none');
                btn.classList.add('bg-secondary', 'text-surface', 'dark:bg-secondary-fixed', 'dark:text-primary', 'active', 'shadow-sm');

                const filter = btn.getAttribute('data-filter');

                projectCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        card.style.display = 'flex';
                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                            card.style.pointerEvents = 'auto';
                        });
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        card.style.pointerEvents = 'none';
                        setTimeout(() => {
                            const currentFilter = btn.getAttribute('data-filter');
                            if (currentFilter !== 'all' && category !== currentFilter) {
                                card.style.display = 'none';
                            }
                        }, 500);
                    }
                });
            });
        });
    }

    // ==========================================
    // 9. RESPONSIVE MOBILE NAVIGATION MENU
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (mobileMenuBtn && mobileMenuOverlay) {
        const toggleMenu = () => {
            const isOpen = mobileMenuOverlay.classList.contains('opacity-100');
            if (isOpen) {
                mobileMenuOverlay.classList.remove('opacity-100', 'pointer-events-auto');
                mobileMenuOverlay.classList.add('opacity-0', 'pointer-events-none');
                mobileMenuIcon.textContent = 'menu';
                document.body.classList.remove('overflow-hidden');
            } else {
                mobileMenuOverlay.classList.remove('opacity-0', 'pointer-events-none');
                mobileMenuOverlay.classList.add('opacity-100', 'pointer-events-auto');
                mobileMenuIcon.textContent = 'close';
                document.body.classList.add('overflow-hidden');
            }
        };
        
        mobileMenuBtn.addEventListener('click', toggleMenu);
        
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('opacity-100', 'pointer-events-auto');
                mobileMenuOverlay.classList.add('opacity-0', 'pointer-events-none');
                mobileMenuIcon.textContent = 'menu';
                document.body.classList.remove('overflow-hidden');
            });
        });
    }

    // ==========================================================
    // 10. OPTIMIZACIONES DE MICRO-INTERACCIONES PREMIUM (DESKTOP)
    // ==========================================================


    
    // 2. Buttery smooth 3D Tilt & Satin reflection on portfolio and service cards
    const init3DTilt = () => {
        const cards = document.querySelectorAll('.project-card, .service-card');
        
        cards.forEach(card => {
            // Inject dynamic satin sheen glare overlay
            if (!card.querySelector('.glare-overlay')) {
                const glare = document.createElement('div');
                glare.className = 'glare-overlay';
                card.appendChild(glare);
            }
            
            card.classList.add('tilt-card');
            const glare = card.querySelector('.glare-overlay');
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Max rotation angles (degrees)
                const rotateX = ((centerY - y) / centerY) * 8; 
                const rotateY = ((x - centerX) / centerX) * 8;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                
                // Position glare Satin light reflection based on cursor
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                if (glare) {
                    glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 85%)`;
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });
    };
    
    // Trigger desktop-only organic enhancements
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        init3DTilt();
    }
});
