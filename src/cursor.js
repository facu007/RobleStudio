import { gsap } from 'gsap';

export function initCustomCursor() {
    // 1. Safety check: Disable completely on touch-only devices
    if (window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    const cursor = document.getElementById('roble-cursor');
    const visual = document.getElementById('roble-cursor-visual');
    const glow = document.getElementById('roble-cursor-glow');
    const ring = document.getElementById('roble-cursor-ring');
    const text = document.getElementById('roble-cursor-text');
    const ripple = document.getElementById('roble-cursor-ripple');
    const stageSvgs = document.querySelectorAll('.stage-svg');

    if (!cursor || !visual || !glow || !ring || !text || !ripple) {
        console.warn('Roble Cursor elements missing from DOM.');
        return;
    }

    // Unhide cursor container now that JavaScript has successfully run
    gsap.set(cursor, { display: 'flex', opacity: 0 });

    // Track active cursor scale and opacity to prevent click events from overriding hover states
    let targetScale = 1;
    let targetOpacity = 1;

    // 2. High-performance coordinates tracking using gsap.quickTo
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power3.out' });

    let firstMove = true;

    window.addEventListener('mousemove', (e) => {
        if (firstMove) {
            // Instant center on first move to prevent jumping from (0,0)
            gsap.set(cursor, { x: e.clientX, y: e.clientY, opacity: 1 });
            firstMove = false;
        } else {
            xTo(e.clientX);
            yTo(e.clientY);
        }
    }, { passive: true });

    // Hide custom cursor when mouse leaves the viewport and show when it enters
    document.addEventListener('mouseleave', () => {
        gsap.to(cursor, { opacity: 0, scale: 0.5, duration: 0.3 });
    });

    document.addEventListener('mouseenter', () => {
        gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.3 });
    });

    // 3. Scroll-Based Evolution (Progressive Growth Stages)
    let currentStage = 1;

    function updateGrowthStage() {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScroll <= 0) return;
        
        const percent = window.scrollY / totalScroll;
        
        let stage = 1;
        if (percent >= 0.75) stage = 4;
        else if (percent >= 0.50) stage = 3;
        else if (percent >= 0.25) stage = 2;

        if (stage !== currentStage) {
            currentStage = stage;
            stageSvgs.forEach((svg, idx) => {
                const stageNum = idx + 1;
                if (stageNum === currentStage) {
                    gsap.killTweensOf(svg);
                    gsap.to(svg, { 
                        opacity: 1, 
                        scale: 1, 
                        duration: 0.4, 
                        ease: 'back.out(1.2)' 
                    });
                } else {
                    gsap.killTweensOf(svg);
                    gsap.to(svg, { 
                        opacity: 0, 
                        scale: 0.7, 
                        duration: 0.3, 
                        ease: 'power2.inOut' 
                    });
                }
            });
        }
    }

    window.addEventListener('scroll', updateGrowthStage, { passive: true });
    // Run once on start to match initial scroll position
    updateGrowthStage();

    // 4. Click Interaction (Organic Root Pulse)
    window.addEventListener('mousedown', () => {
        // Compress relative to the active target scale of the current hover context
        gsap.to(visual, { scale: targetScale * 0.8, duration: 0.15, ease: 'power2.out' });
    });

    window.addEventListener('mouseup', () => {
        // Restore scale and opacity to their current hover context target state
        gsap.to(visual, { scale: targetScale, opacity: targetOpacity, duration: 0.3, ease: 'back.out(1.8)' });

        // Trigger spreading roots animation
        gsap.killTweensOf(ripple);
        gsap.set(ripple, { opacity: 0.8, scale: 0.5 });
        
        ripple.classList.remove('ripple-active');
        void ripple.offsetWidth; // Force reflow
        ripple.classList.add('ripple-active');

        gsap.to(ripple, {
            opacity: 0,
            scale: 1.4,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => {
                ripple.classList.remove('ripple-active');
            }
        });
    });

    // 5. Interactive Hovers (Micro-interactions & Magnetic Effects)
    
    // Theme Switcher, CTA Buttons, Schedule Cells, Submits, Nav Mobile Toggles
    const buttons = document.querySelectorAll(
        'button, .btn, #theme-toggle, #skip-intro-btn, [role="button"], ' +
        '#booking-submit-btn, .calendar-btn, .booking-btn'
    );

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            // Calculate geometrical center of the element
            const btnCenterX = rect.left + rect.width / 2;
            const btnCenterY = rect.top + rect.height / 2;

            // Distance from mouse to center
            const dx = e.clientX - btnCenterX;
            const dy = e.clientY - btnCenterY;

            // elastically move button slightly toward mouse (magnetic attraction)
            gsap.to(btn, { 
                x: dx * 0.22, 
                y: dy * 0.22, 
                duration: 0.3, 
                ease: 'power2.out' 
            });

            // Smooth snap of the custom cursor towards the button center
            const targetCursorX = btnCenterX + dx * 0.35;
            const targetCursorY = btnCenterY + dy * 0.35;
            xTo(targetCursorX);
            yTo(targetCursorY);
        });

        btn.addEventListener('mouseenter', () => {
            targetScale = 1.3;
            targetOpacity = 1;
            // Expand acorn and trigger soft green glow
            gsap.to(visual, { scale: targetScale, opacity: targetOpacity, duration: 0.3, ease: 'power2.out' });
            gsap.set(glow, { backgroundColor: '#1F3A2E' });
            gsap.to(glow, { opacity: 0.5, scale: 1.6, duration: 0.3 });
        });

        btn.addEventListener('mouseleave', () => {
            targetScale = 1;
            targetOpacity = 1;
            // Elastic snap-back of the button to its original position
            gsap.to(btn, { 
                x: 0, 
                y: 0, 
                duration: 0.5, 
                ease: 'elastic.out(1.1, 0.4)' 
            });

            // Restore default cursor scale and disable glow
            gsap.to(visual, { scale: targetScale, opacity: targetOpacity, duration: 0.3, ease: 'power2.out' });
            gsap.to(glow, { opacity: 0, scale: 1, duration: 0.3 });
        });
    });

    // Links (Standard links that are not styled as buttons or portafolio cards)
    const links = document.querySelectorAll(
        'a:not(.project-card):not(.btn):not([role="button"]):not(.tilt-card)'
    );

    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            targetScale = 0.7;
            targetOpacity = 0.65;
            // Refine cursor: make it thinner, smaller, and slightly translucent
            gsap.to(visual, { scale: targetScale, opacity: targetOpacity, duration: 0.3, ease: 'power2.out' });
        });

        link.addEventListener('mouseleave', () => {
            targetScale = 1;
            targetOpacity = 1;
            // Restore default scale and opacity
            gsap.to(visual, { scale: targetScale, opacity: targetOpacity, duration: 0.3, ease: 'power2.out' });
        });
    });

    // Portfolio Items / Cards (.tilt-card)
    const portfolioCards = document.querySelectorAll('.tilt-card, [data-hover-explore]');

    portfolioCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            targetScale = 0.5;
            targetOpacity = 0;
            // Temporarily hide the acorn seed to prevent overlapping text
            gsap.to(visual, { opacity: targetOpacity, scale: targetScale, duration: 0.25 });

            // Expand the outer ring into a beautiful circular lens
            gsap.to(ring, {
                width: 76,
                height: 76,
                borderColor: 'rgba(107, 79, 58, 0.45)', // Elegant brown
                backgroundColor: 'rgba(243, 240, 235, 0.08)',
                duration: 0.35,
                ease: 'power2.out'
            });

            // Fade in the 'Ver' tracking text
            gsap.to(text, { opacity: 1, duration: 0.25 });
        });

        card.addEventListener('mouseleave', () => {
            targetScale = 1;
            targetOpacity = 1;
            // Restore visual acorn seed
            gsap.to(visual, { opacity: targetOpacity, scale: targetScale, duration: 0.3, ease: 'power2.out' });

            // Close the circular lens
            gsap.to(ring, {
                width: 0,
                height: 0,
                borderColor: 'rgba(107, 79, 58, 0)',
                backgroundColor: 'rgba(243, 240, 235, 0)',
                duration: 0.35,
                ease: 'power2.out'
            });

            // Fade out the hover text
            gsap.to(text, { opacity: 0, duration: 0.2 });
        });
    });
}
