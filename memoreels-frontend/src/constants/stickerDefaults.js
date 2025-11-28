// Thoughtfully designed presets (branding always at the bottom).
// Tokens supported in text: {{eventName}}, {{accessCode}}, {{location}}
export const STICKER_PRESETS = [
  // 1) Clean Classic (light)
  {
    meta: { key: "clean_classic", name: "Clean Classic" },
    paper: { widthMm: 90, heightMm: 90, bgColor: "#FFFFFF" },
    theme: { background: "#FFFFFF", text: "#111827" },
    elements: [
      { id: "qr-1", type: "qr", x: 35, y: 10, width: 30, height: 30, binding: "eventUrl" },
      { id: "title-1", type: "text", x: 10, y: 45, text: "{{eventName}}", fontSize: 18, color: "#111827" },
      { id: "subtitle-1", type: "text", x: 10, y: 55, text: "Scan to view photos", fontSize: 12, color: "#6B7280" },
      { id: "code-1", type: "text", x: 10, y: 65, text: "Code: {{accessCode}}", fontSize: 13, color: "#374151" },
      { id: "location-1", type: "text", x: 10, y: 74, text: "Location: {{location}}", fontSize: 12, color: "#6B7280" },
      { id: "branding-1", type: "branding", x: 0, y: 92, width: 100, height: 8, variant: "powered_by" },
    ],
  },

  // 2) Left QR, Right Text (warm tint)
  {
    meta: { key: "left_qr_right_text", name: "Left QR, Right Text" },
    paper: { widthMm: 90, heightMm: 90, bgColor: "#FFF7ED" },
    theme: { background: "#FFF7ED", text: "#1F2937" },
    elements: [
      { id: "qr-1", type: "qr", x: 8, y: 18, width: 28, height: 28, binding: "eventUrl" },
      { id: "title-1", type: "text", x: 42, y: 20, text: "{{eventName}}", fontSize: 18, color: "#1F2937" },
      { id: "subtitle-1", type: "text", x: 42, y: 30, text: "Scan to join the gallery", fontSize: 12, color: "#6B7280" },
      { id: "code-1", type: "text", x: 42, y: 40, text: "Code: {{accessCode}}", fontSize: 13, color: "#374151" },
      { id: "location-1", type: "text", x: 42, y: 49, text: "Location: {{location}}", fontSize: 12, color: "#6B7280" },
      { id: "branding-1", type: "branding", x: 0, y: 92, width: 100, height: 8, variant: "powered_by" },
    ],
  },

  // 3) Header Title, QR Right (neutral cool)
  {
    meta: { key: "header_title_qr_right", name: "Header Title, QR Right" },
    paper: { widthMm: 90, heightMm: 90, bgColor: "#F8FAFC" },
    theme: { background: "#F8FAFC", text: "#0F172A" },
    elements: [
      { id: "title-1", type: "text", x: 6, y: 10, text: "{{eventName}}", fontSize: 18, color: "#0F172A" },
      { id: "subtitle-1", type: "text", x: 6, y: 20, text: "Open with a quick scan", fontSize: 12, color: "#64748B" },
      { id: "code-1", type: "text", x: 6, y: 30, text: "Code: {{accessCode}}", fontSize: 13, color: "#334155" },
      { id: "location-1", type: "text", x: 6, y: 39, text: "Location: {{location}}", fontSize: 12, color: "#475569" },
      { id: "qr-1", type: "qr", x: 62, y: 12, width: 30, height: 30, binding: "eventUrl" },
      { id: "branding-1", type: "branding", x: 0, y: 92, width: 100, height: 8, variant: "powered_by" },
    ],
  },

  // 4) Centered Stack (QR below title)
  {
    meta: { key: "centered_stack", name: "Centered Stack" },
    paper: { widthMm: 90, heightMm: 90, bgColor: "#FFFFFF" },
    theme: { background: "#FFFFFF", text: "#111827" },
    elements: [
      { id: "title-1", type: "text", x: 10, y: 12, text: "{{eventName}}", fontSize: 18, color: "#111827" },
      { id: "subtitle-1", type: "text", x: 10, y: 22, text: "Point camera at the QR", fontSize: 12, color: "#6B7280" },
      { id: "qr-1", type: "qr", x: 35, y: 28, width: 30, height: 30, binding: "eventUrl" },
      { id: "code-1", type: "text", x: 10, y: 62, text: "Code: {{accessCode}}", fontSize: 13, color: "#374151" },
      { id: "location-1", type: "text", x: 10, y: 71, text: "Location: {{location}}", fontSize: 12, color: "#6B7280" },
      { id: "branding-1", type: "branding", x: 0, y: 92, width: 100, height: 8, variant: "powered_by" },
    ],
  },

  // 5) Dark Mode (high contrast)
  {
    meta: { key: "dark_mode", name: "Dark Mode" },
    paper: { widthMm: 90, heightMm: 90, bgColor: "#111827" },
    theme: { background: "#111827", text: "#F9FAFB" },
    elements: [
      { id: "title-1", type: "text", x: 8, y: 12, text: "{{eventName}}", fontSize: 18, color: "#F9FAFB" },
      { id: "subtitle-1", type: "text", x: 8, y: 22, text: "Scan the QR to access", fontSize: 12, color: "#D1D5DB" },
      { id: "qr-1", type: "qr", x: 60, y: 16, width: 30, height: 30, binding: "eventUrl" },
      { id: "code-1", type: "text", x: 8, y: 38, text: "Code: {{accessCode}}", fontSize: 13, color: "#E5E7EB" },
      { id: "location-1", type: "text", x: 8, y: 47, text: "Location: {{location}}", fontSize: 12, color: "#D1D5DB" },
      { id: "branding-1", type: "branding", x: 0, y: 92, width: 100, height: 8, variant: "powered_by" },
    ],
  },
];

// Keep a single default for existing usage.
export const DEFAULT_STICKER_LAYOUT = STICKER_PRESETS[0];
