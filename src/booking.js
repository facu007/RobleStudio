const BOOKING_STORAGE_KEY = 'roble_studio_booking';
const DEFAULT_BOOKING_TIMEZONE = 'America/Mexico_City';
const DEFAULT_BOOKING_TIMEZONE_LABEL = 'CDMX';
const AVAILABLE_HOURS = ['09:30', '10:30', '12:00', '14:30', '15:30', '16:30'];
const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const EMPTY_SLOTS_MESSAGE = '<p class="text-xs text-on-surface-variant dark:text-inverse-primary/50 italic col-span-full py-4 text-center">Selecciona un día para ver horas</p>';

const bookingTimezone = import.meta.env.VITE_BOOKING_TIMEZONE?.trim() || DEFAULT_BOOKING_TIMEZONE;
const bookingTimezoneLabel = import.meta.env.VITE_BOOKING_TIMEZONE_LABEL?.trim() || DEFAULT_BOOKING_TIMEZONE_LABEL;
const bookingWebhookUrl = import.meta.env.VITE_BOOKING_WEBHOOK_URL?.trim() || '';

function pad(value) {
    return String(value).padStart(2, '0');
}

function toDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(dateKey) {
    if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return null;
    }

    const [year, month, day] = dateKey.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);

    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return parsed;
}

function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatLongDate(date) {
    const formatted = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return capitalize(formatted);
}

function formatShortDate(dateKey) {
    const parsed = parseDateKey(dateKey);
    if (!parsed) return dateKey;

    return parsed.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
}

function formatCalendarStamp(dateKey, time) {
    return `${dateKey.replaceAll('-', '')}T${time.replace(':', '')}00`;
}

function formatUtcStamp(date = new Date()) {
    return [
        date.getUTCFullYear(),
        pad(date.getUTCMonth() + 1),
        pad(date.getUTCDate())
    ].join('') + 'T' + [
        pad(date.getUTCHours()),
        pad(date.getUTCMinutes()),
        pad(date.getUTCSeconds())
    ].join('') + 'Z';
}

function addMinutesToTime(time, minutesToAdd) {
    const [hours, minutes] = time.split(':').map(Number);
    const stamp = new Date(2000, 0, 1, hours, minutes + minutesToAdd, 0, 0);

    return `${pad(stamp.getHours())}:${pad(stamp.getMinutes())}`;
}

function escapeIcsText(value = '') {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
}

function normalizeStoredBooking(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const normalized = { ...data };

    if (!normalized.dateKey && normalized.date) {
        const parsedLegacyDate = new Date(normalized.date);
        if (!Number.isNaN(parsedLegacyDate.getTime())) {
            normalized.dateKey = toDateKey(parsedLegacyDate);
        }
    }

    normalized.timezone = normalized.timezone || bookingTimezone;
    normalized.timezoneLabel = normalized.timezoneLabel || bookingTimezoneLabel;

    if (!normalized.dateKey || !normalized.time) {
        return null;
    }

    return normalized;
}

async function postBookingWebhook(bookingData) {
    const targetUrl = bookingWebhookUrl || '/api/booking';

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            throw new Error(`Booking endpoint responded with ${response.status}`);
        }

        return true;
    } catch (error) {
        console.warn('Booking submission failed:', error);
        return false;
    }
}

export function initBooking() {
    const calendarMonthName = document.getElementById('calendar-month-name');
    const calendarDaysGrid = document.getElementById('calendar-days-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const calendarContinueBtn = document.getElementById('calendar-continue-btn');
    const step1Container = document.getElementById('booking-step-1');
    const step2Container = document.getElementById('booking-step-2');
    const step3Container = document.getElementById('booking-step-3');
    const backBtn = document.getElementById('booking-back-btn');
    const summaryDatetime = document.getElementById('booking-summary-datetime');
    const successSummaryDate = document.getElementById('success-summary-date');
    const bookingForm = document.getElementById('booking-form');
    const finishBtn = document.getElementById('success-finish-btn');
    const bannerContainer = document.getElementById('booking-stored-banner');
    const bannerText = document.getElementById('booking-stored-text');
    const cancelBookingBtn = document.getElementById('cancel-booking-btn');
    const googleCalBtn = document.getElementById('success-google-cal');

    if (
        !calendarMonthName ||
        !calendarDaysGrid ||
        !timeSlotsContainer ||
        !calendarContinueBtn ||
        !step1Container ||
        !step2Container ||
        !step3Container ||
        !summaryDatetime ||
        !successSummaryDate ||
        !bookingForm
    ) {
        console.warn('Booking elements missing from DOM.');
        return;
    }

    let selectedDate = null;
    let selectedTime = null;
    let currentDateContext = new Date();

    const resetTimeSlots = () => {
        timeSlotsContainer.innerHTML = EMPTY_SLOTS_MESSAGE;
        calendarContinueBtn.disabled = true;
    };

    const updateBookingSummary = () => {
        if (!selectedDate || !selectedTime) return;

        const dateTimeString = `${formatLongDate(selectedDate)} a las ${selectedTime} hs`;
        summaryDatetime.textContent = dateTimeString;
        successSummaryDate.textContent = `${dateTimeString} (${bookingTimezoneLabel}) • Google Meet`;
    };

    const showBookingBanner = (data) => {
        if (!data || !bannerText || !bannerContainer) return;

        bannerText.textContent = `¡Hola ${data.name}! Tienes una llamada agendada: ${formatShortDate(data.dateKey)} a las ${data.time} hs (${data.timezoneLabel}).`;
        bannerContainer.classList.remove('hidden');
    };

    const checkStoredBooking = () => {
        let stored = null;

        try {
            const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
            stored = raw ? normalizeStoredBooking(JSON.parse(raw)) : null;
        } catch (error) {
            console.warn('Stored booking could not be parsed and was cleared.', error);
            localStorage.removeItem(BOOKING_STORAGE_KEY);
        }

        if (stored) {
            localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(stored));
            showBookingBanner(stored);
            return;
        }

        if (bannerContainer) {
            bannerContainer.classList.add('hidden');
        }
    };

    const loadTimeSlots = () => {
        timeSlotsContainer.innerHTML = '';

        AVAILABLE_HOURS.forEach((hour) => {
            const slot = document.createElement('button');
            slot.type = 'button';
            slot.className = 'py-2 px-3 border border-outline-variant/30 dark:border-outline-variant/15 text-primary dark:text-inverse-on-surface text-xs font-semibold rounded-lg hover:border-secondary hover:bg-secondary/10 transition-all text-center focus:ring-2 focus:ring-secondary/50';
            slot.textContent = `${hour} hs`;

            slot.addEventListener('click', () => {
                document.querySelectorAll('#time-slots-container button').forEach((button) => {
                    button.className = 'py-2 px-3 border border-outline-variant/30 dark:border-outline-variant/15 text-primary dark:text-inverse-on-surface text-xs font-semibold rounded-lg hover:border-secondary hover:bg-secondary/10 transition-all text-center focus:ring-2 focus:ring-secondary/50';
                });

                slot.className = 'py-2 px-3 bg-secondary text-white border-secondary text-xs font-bold rounded-lg shadow-sm text-center focus:ring-2 focus:ring-secondary/50';
                selectedTime = hour;
                calendarContinueBtn.disabled = false;
            });

            timeSlotsContainer.appendChild(slot);
        });
    };

    const loadCalendarDays = () => {
        calendarDaysGrid.innerHTML = '';

        const year = currentDateContext.getFullYear();
        const month = currentDateContext.getMonth();
        calendarMonthName.textContent = `${MONTH_NAMES[month]} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        let alignedFirstDay = firstDayIndex - 1;
        if (alignedFirstDay === -1) {
            alignedFirstDay = 6;
        }

        const totalDays = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < alignedFirstDay; i += 1) {
            calendarDaysGrid.appendChild(document.createElement('div'));
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= totalDays; day += 1) {
            const dayCell = document.createElement('button');
            dayCell.type = 'button';
            dayCell.className = 'w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center font-medium text-xs transition-all relative focus:outline-none focus:ring-2 focus:ring-secondary/50';

            const cellDate = new Date(year, month, day);
            const dayOfWeek = cellDate.getDay();
            const isPast = cellDate < today;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            dayCell.textContent = day;

            if (isPast || isWeekend) {
                dayCell.className += ' text-on-surface-variant/20 dark:text-inverse-primary/20 cursor-not-allowed';
                dayCell.disabled = true;
                calendarDaysGrid.appendChild(dayCell);
                continue;
            }

            dayCell.className += ' text-primary dark:text-inverse-on-surface hover:bg-secondary/15 dark:hover:bg-secondary/35 cursor-pointer font-bold';

            if (selectedDate && toDateKey(selectedDate) === toDateKey(cellDate)) {
                dayCell.className += ' bg-[#db790a] text-white hover:bg-[#db790a]';
            }

            dayCell.addEventListener('click', () => {
                document.querySelectorAll('#calendar-days-grid button').forEach((button) => {
                    if (button.disabled) return;
                    button.className = 'w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center font-medium text-xs transition-all relative focus:outline-none focus:ring-2 focus:ring-secondary/50 text-primary dark:text-inverse-on-surface hover:bg-secondary/15 dark:hover:bg-secondary/35 cursor-pointer font-bold';
                });

                dayCell.className = 'w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-full flex items-center justify-center font-medium text-xs transition-all relative focus:outline-none focus:ring-2 focus:ring-secondary/50 bg-[#db790a] text-white font-bold shadow-md';
                selectedDate = cellDate;
                selectedTime = null;
                loadTimeSlots();
                calendarContinueBtn.disabled = true;
            });

            calendarDaysGrid.appendChild(dayCell);
        }
    };

    const resetBookingStepToStart = () => {
        step3Container.classList.add('hidden');
        step2Container.classList.add('hidden');
        step1Container.classList.remove('hidden');
        bookingForm.reset();

        selectedDate = null;
        selectedTime = null;
        currentDateContext = new Date();

        resetTimeSlots();
        loadCalendarDays();
    };

    const initIcsDownload = () => {
        const buttonsContainer = document.querySelector('#booking-step-3 > div.flex');
        if (!buttonsContainer || document.getElementById('success-ics-download')) {
            return;
        }

        const icsBtn = document.createElement('button');
        icsBtn.id = 'success-ics-download';
        icsBtn.type = 'button';
        icsBtn.className = 'flex-grow bg-surface-container hover:bg-surface-container-high dark:bg-primary-container dark:hover:bg-primary/50 text-primary dark:text-inverse-on-surface py-3 rounded-lg font-label-md text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 border border-outline-variant/30 dark:border-outline-variant/15';
        icsBtn.innerHTML = '<span class="material-symbols-outlined text-xs">download</span> Apple / Outlook (.ics)';

        icsBtn.addEventListener('click', () => {
            const rawStored = localStorage.getItem(BOOKING_STORAGE_KEY);
            if (!rawStored) return;

            const bookingData = normalizeStoredBooking(JSON.parse(rawStored));
            if (!bookingData) return;

            const startStamp = formatCalendarStamp(bookingData.dateKey, bookingData.time);
            const endStamp = formatCalendarStamp(bookingData.dateKey, addMinutesToTime(bookingData.time, 30));
            const description = escapeIcsText(
                `Hola ${bookingData.name}. Tu Sesión de Descubrimiento con Roble Studio está agendada. Negocio: ${bookingData.business}. Principal objetivo: ${bookingData.goal}`
            );

            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Roble Studio//Booking Widget//ES',
                'CALSCALE:GREGORIAN',
                `X-WR-TIMEZONE:${bookingData.timezone}`,
                'BEGIN:VEVENT',
                `UID:${Date.now()}@roblestudio.com`,
                `DTSTAMP:${formatUtcStamp()}`,
                `DTSTART;TZID=${bookingData.timezone}:${startStamp}`,
                `DTEND;TZID=${bookingData.timezone}:${endStamp}`,
                'SUMMARY:Llamada Estratégica • Roble Studio',
                `DESCRIPTION:${description}`,
                'LOCATION:Google Meet',
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);

            link.href = objectUrl;
            link.download = 'llamada_estrategica_roble_studio.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        });

        buttonsContainer.insertBefore(icsBtn, buttonsContainer.lastElementChild);
    };

    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDateContext.setMonth(currentDateContext.getMonth() - 1);
            loadCalendarDays();
            resetTimeSlots();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDateContext.setMonth(currentDateContext.getMonth() + 1);
            loadCalendarDays();
            resetTimeSlots();
        });
    }

    calendarContinueBtn.addEventListener('click', () => {
        if (!selectedDate || !selectedTime) return;

        updateBookingSummary();
        step1Container.classList.add('hidden');
        step2Container.classList.remove('hidden');
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            step2Container.classList.add('hidden');
            step1Container.classList.remove('hidden');
        });
    }

    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Honeypot anti-spam check
        const honeypot = document.getElementById('booking-honeypot')?.value;
        if (honeypot) {
            console.warn('Spam detected via Honeypot field.');
            resetBookingStepToStart();
            return;
        }

        if (!selectedDate || !selectedTime) {
            return;
        }

        const bookingData = {
            name: document.getElementById('client-name').value.trim(),
            email: document.getElementById('client-email').value.trim(),
            business: document.getElementById('client-business').value.trim(),
            website: document.getElementById('client-website')?.value.trim() || '',
            goal: document.getElementById('client-goal').value.trim(),
            dateKey: toDateKey(selectedDate),
            time: selectedTime,
            timezone: bookingTimezone,
            timezoneLabel: bookingTimezoneLabel,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingData));
        void postBookingWebhook(bookingData);

        step2Container.classList.add('hidden');
        step3Container.classList.remove('hidden');
        showBookingBanner(bookingData);
    });

    if (finishBtn) {
        finishBtn.addEventListener('click', resetBookingStepToStart);
    }

    if (googleCalBtn) {
        googleCalBtn.addEventListener('click', () => {
            const rawStored = localStorage.getItem(BOOKING_STORAGE_KEY);
            if (!rawStored) return;

            const bookingData = normalizeStoredBooking(JSON.parse(rawStored));
            if (!bookingData) return;

            const startStamp = formatCalendarStamp(bookingData.dateKey, bookingData.time);
            const endStamp = formatCalendarStamp(bookingData.dateKey, addMinutesToTime(bookingData.time, 30));
            const details = [
                `Hola ${bookingData.name}.`,
                'Tu Llamada Estratégica con Roble Studio ha sido confirmada.',
                '',
                'Detalles del contacto:',
                `- Nombre: ${bookingData.name}`,
                `- Negocio: ${bookingData.business}`,
                `- Objetivo: ${bookingData.goal}`,
                '',
                'Nos conectaremos a través de Google Meet.'
            ].join('\n');
            const gCalUrl = new URL('https://calendar.google.com/calendar/render');

            gCalUrl.searchParams.set('action', 'TEMPLATE');
            gCalUrl.searchParams.set('text', 'Llamada Estratégica • Roble Studio');
            gCalUrl.searchParams.set('dates', `${startStamp}/${endStamp}`);
            gCalUrl.searchParams.set('details', details);
            gCalUrl.searchParams.set('location', 'Google Meet');
            gCalUrl.searchParams.set('trp', 'true');
            gCalUrl.searchParams.set('sprop', 'website:roblestudio.com');
            gCalUrl.searchParams.set('ctz', bookingData.timezone);

            window.open(gCalUrl.toString(), '_blank', 'noopener,noreferrer');
        });
    }

    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener('click', () => {
            if (!confirm('¿Estás seguro de que deseas cancelar tu llamada estratégica con Roble Studio?')) {
                return;
            }

            localStorage.removeItem(BOOKING_STORAGE_KEY);
            checkStoredBooking();
            resetBookingStepToStart();
        });
    }

    const observer = new MutationObserver(() => {
        if (!step3Container.classList.contains('hidden')) {
            initIcsDownload();
        }
    });

    if (step3Container.parentElement) {
        observer.observe(step3Container.parentElement, { attributes: true, subtree: true });
    }

    currentDateContext = new Date();
    loadCalendarDays();
    resetTimeSlots();
    checkStoredBooking();
}
