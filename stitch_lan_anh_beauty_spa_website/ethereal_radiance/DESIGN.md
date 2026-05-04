---
name: Ethereal Radiance
colors:
  surface: '#fff8f5'
  surface-dim: '#e5d7cf'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e8'
  surface-container: '#f9ebe2'
  surface-container-high: '#f4e6dd'
  surface-container-highest: '#eee0d7'
  on-surface: '#211a15'
  on-surface-variant: '#4e453b'
  inverse-surface: '#372f29'
  inverse-on-surface: '#fceee5'
  outline: '#80756a'
  outline-variant: '#d2c4b7'
  surface-tint: '#775932'
  primary: '#775932'
  on-primary: '#ffffff'
  primary-container: '#c5a073'
  on-primary-container: '#503713'
  inverse-primary: '#e7c090'
  secondary: '#615e59'
  on-secondary: '#ffffff'
  secondary-container: '#e7e2db'
  on-secondary-container: '#67645f'
  tertiary: '#695c51'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3a497'
  on-tertiary-container: '#453a30'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb6'
  primary-fixed-dim: '#e7c090'
  on-primary-fixed: '#2a1800'
  on-primary-fixed-variant: '#5d421d'
  secondary-fixed: '#e7e2db'
  secondary-fixed-dim: '#cac6bf'
  on-secondary-fixed: '#1d1b17'
  on-secondary-fixed-variant: '#494742'
  tertiary-fixed: '#f1dfd1'
  tertiary-fixed-dim: '#d4c4b6'
  on-tertiary-fixed: '#231a11'
  on-tertiary-fixed-variant: '#50453a'
  background: '#fff8f5'
  on-background: '#211a15'
  surface-variant: '#eee0d7'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.15em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  section-padding: 120px
  component-gap: 24px
---

## Brand & Style

This design system is crafted for a premium beauty and wellness experience. The brand personality is serene, expert, and deeply feminine, catering to a clientele that values high-end aesthetics and meticulous care. 

The visual style is **Minimalist-Luxurious**. It leverages vast amounts of negative space to create an "airy" feel, allowing high-quality imagery to act as the primary window into the service experience. By combining the precision of modern layout with the warmth of organic beige and gold tones, the system establishes a sense of quiet confidence and professional reliability.

## Colors

The palette is derived directly from the logo's metallic and earthy tones. 
- **Primary Gold (#C5A073):** Used for interactive elements, highlights, and icons to convey premium quality.
- **Secondary Beige (#F5F0E9):** A soft, skin-tone adjacent neutral used for large section backgrounds to prevent the "coldness" of pure white.
- **Tertiary Champagne (#E2D1C3):** A transition color for subtle UI depth and decorative elements.
- **Deep Bronze Neutral (#3D352F):** Used for primary text to provide better readability and a softer contrast than pure black.
- **Pure White (#FFFFFF):** The canvas for the entire system, ensuring the "clean" and "airy" requirement is met.

## Typography

This design system utilizes a high-contrast typographic pairing to balance tradition with modernity. 

**Noto Serif** is reserved for headlines and editorial callouts, evoking the sophistication of a luxury magazine. **Manrope** provides a highly readable, balanced sans-serif foundation for body copy and UI controls. A specific "Label-Caps" style is included to mirror the spaced-out, professional sub-branding found in the logo, ideal for category tags and small navigation elements.

## Layout & Spacing

The layout follows a **Fixed Grid** model centered on a 1280px maximum container. The philosophy emphasizes "breathability" over information density. 

Section transitions should feature significant vertical padding (120px+) to ensure each treatment or service is presented in isolation, reducing cognitive load. A 12-column grid is used with wide gutters (32px) to maintain an architectural, structured feel even within a minimalist aesthetic.

## Elevation & Depth

To maintain a minimalist and "airy" look, this design system avoids heavy shadows. Depth is communicated through:
- **Tonal Layering:** Placing pure white cards or components over the Secondary Beige (#F5F0E9) background.
- **Ambient Glows:** Where depth is strictly necessary (e.g., floating booking buttons), use an extremely diffused, low-opacity shadow tinted with the Primary Gold color (#C5A073 at 10% opacity).
- **Ghost Outlines:** Use 1px borders in Tertiary Champagne for input fields and containers to define space without adding visual weight.

## Shapes

The shape language is **Soft (0.25rem)**. While the logo contains organic floral curves, the UI remains structured and professional. Slight rounding on buttons and image containers softens the "sharpness" of the minimalist grid, making the interface feel more approachable and skin-friendly, while still maintaining the precision of a high-end medical spa.

## Components

### Buttons
- **Primary:** Solid Primary Gold (#C5A073) with white text. Use for high-conversion actions like "Book Appointment."
- **Secondary:** Transparent background with a 1px Gold border and Gold text.
- **Interaction:** On hover, buttons should have a subtle brightness shift rather than a heavy color change.

### Navigation
- **Header:** Sticky with a background blur (glassmorphism) or solid white. Centered logo with navigation links split on either side, using the "Label-Caps" typography.
- **CTA:** A distinct "Book Now" button should always be present in the top-right corner.

### Cards & Imagery
- **Service Cards:** Use high-aspect-ratio images (4:5 or 2:3) with titles in Noto Serif placed beneath the image. Avoid boxing these in borders; use whitespace to define the card area.
- **Imagery Style:** Soft lighting, macro shots of textures (creams, oils, stones), and clean, tranquil spa environments.

### Input Fields
- Underlined inputs or very light champagne-bordered boxes. Focus states should transition the border color to Primary Gold.

### Chips & Tags
- Used for service categories (e.g., "Skincare", "Massage"). Pill-shaped with a Secondary Beige fill and Deep Bronze text.