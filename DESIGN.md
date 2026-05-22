---
name: Organic Tech
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede8'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#424843'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#737973'
  outline-variant: '#c2c8c2'
  surface-tint: '#4d6355'
  primary: '#051a0f'
  on-primary: '#ffffff'
  primary-container: '#1a2f23'
  on-primary-container: '#809787'
  inverse-primary: '#b4ccbb'
  secondary: '#805533'
  on-secondary: '#ffffff'
  secondary-container: '#fdc39a'
  on-secondary-container: '#794e2e'
  tertiary: '#271100'
  on-tertiary: '#ffffff'
  tertiary-container: '#452200'
  on-tertiary-container: '#db790a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e9d6'
  primary-fixed-dim: '#b4ccbb'
  on-primary-fixed: '#0a2014'
  on-primary-fixed-variant: '#364c3e'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#f4bb92'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#653d1e'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  code-snippet:
    fontFamily: Courier Prime
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  section-gap: 120px
---

## Brand & Style
This design system embodies "Organic Tech," a specialized aesthetic that bridges the gap between artisanal craftsmanship and high-performance engineering. It is designed to evoke the durability of aged oak and the precision of modern syntax. 

The visual direction follows a **Modern Minimalism** approach infused with **Tactile** elements. We utilize high-quality whitespace to suggest breathing room, while integrating subtle organic textures—such as grain-inspired micro-patterns—to prevent the UI from feeling sterile. The emotional goal is to feel grounded, authoritative, and bespoke.

## Colors
The palette is rooted in a terrestrial foundation. **Deep Forest Green** serves as the primary anchor for text and structural elements, providing better legibility and a softer "hit" than pure black. **Warm Oak Brown** is used for secondary accents, icons, and subtle borders. 

The primary call-to-action color is **Burnt Orange**, used sparingly to ensure high conversion and visual pop against the creamy **Soft Sand** background. Neutral surfaces should oscillate between the Sand background and a slightly darker "Oak" tint for layered components.

## Typography
The typographic hierarchy relies on the contrast between the authoritative **Playfair Display** and the utilitarian **Inter**. 

- **Headlines:** Use Playfair Display for all major headings. The high stroke contrast suggests elegance and heritage.
- **Body:** Use Inter for all reading experiences and technical descriptions. It provides a clean, neutral counter-balance to the expressive serif.
- **Micro-copy:** Use Inter with increased letter spacing and uppercase styling for labels and tags to maintain a "blueprint" or technical feel.

## Layout & Spacing
The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. We prioritize "Ample Whitespace," meaning section gaps are intentionally large (120px+) to allow content to breathe and feel premium.

Layouts should often be asymmetrical to mimic organic growth, with images or code blocks bleeding off the grid slightly. Use a consistent 8px base unit for all internal component padding and margins to ensure technical precision amidst the organic aesthetic.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Ambient Shadows**. Instead of harsh drop shadows, use soft, diffused shadows with a slight tint of the Primary Forest Green (e.g., `rgba(26, 47, 35, 0.08)`).

- **Level 1 (Surface):** The Sand background.
- **Level 2 (Cards):** Slightly elevated with a soft shadow and a 1px border in a pale Oak tint.
- **Level 3 (Overlay):** Used for navigation or modals, featuring a subtle backdrop blur to simulate frosted glass over wood textures.
- **Textures:** Apply a low-opacity (.03) noise or wood-grain SVG pattern to Level 2 surfaces to reinforce the "Roble" brand metaphor.

## Shapes
The shape language is defined as **Rounded (Level 2)**. Corners are smoothed to mimic the feel of sanded wood. Avoid sharp 90-degree angles in the UI; even code blocks and decorative elements should have a standard 0.5rem (8px) radius. 

Larger containers (like hero images or cards) should utilize `rounded-xl` (1.5rem) to emphasize the soft, organic nature of the brand.

## Components
- **Buttons:** Primary buttons use the Burnt Orange background with white Inter bold text. Secondary buttons use a Deep Forest Green outline with a subtle grain texture hover effect.
- **Chips:** Used for "Tech Stack" tags. These should have a Soft Sand background and a thin Oak Brown border.
- **Cards:** Cards feature a 1px border in a lightened oak shade and a soft ambient shadow. If the card contains an image, the image should have a subtle 0.5s zoom effect on hover.
- **Input Fields:** Use a minimalist bottom-border only or a very light Sand fill. Focus states should transition the border color to Warm Oak Brown.
- **Code Snippets:** Decorative code snippets should be presented in a monospaced font inside a container that looks like "carved" wood—darker green background with lowered inner shadows.
- **Lists:** Bullet points should be replaced with custom "Oak Leaf" or simple "Crosshair" icons to blend the nature/tech themes.