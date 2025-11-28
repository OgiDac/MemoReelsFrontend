import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const APP_BASE =
  import.meta.env.VITE_APP_PUBLIC_BASE ?? "https://app.yourdomain.com";

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export default function StickerCanvas({
  template,
  event,
  selectedId,
  onSelect,
  onElementChange,
}) {
  const paper = template?.paper || { widthMm: 90, heightMm: 90 };
  const elements = Array.isArray(template?.elements) ? template.elements : [];
  const theme = template?.theme || {};
  const bgColor = theme.background || paper.bgColor || "#FFFFFF";
  const defaultText = theme.text || "#111827";

  const canvasRef = useRef(null);
  const elNodesRef = useRef(new Map());
  const [drag, setDrag] = useState(null); // {id, startClientX/Y, originX/Y, rectWidth/Height, wPct, hPct}

  const canvasWidth = 640;
  const aspect =
    paper.widthMm && paper.heightMm ? paper.heightMm / paper.widthMm : 1;
  const canvasHeight = canvasWidth * aspect;

  const url = event?.code ? `${APP_BASE}/e/${event.code}` : "";

  const resolveText = (raw) => {
    if (!raw) return "";
    return raw
      .replaceAll("{{eventName}}", event?.name || "")
      .replaceAll("{{accessCode}}", event?.code || "")
      .replaceAll("{{location}}", event?.location || "");
  };

  const setNodeRefFor = (id) => (node) => {
    if (node) elNodesRef.current.set(id, node);
    else elNodesRef.current.delete(id);
  };

  const measurePctSize = (id) => {
    const node = elNodesRef.current.get(id);
    const canvas = canvasRef.current;
    if (!node || !canvas) return { w: 0, h: 0 };
    const n = node.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    return { w: (n.width / c.width) * 100, h: (n.height / c.height) * 100 };
  };

  const startDrag = (e, el) => {
    if (el.type === "branding") return; // fixed bar
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const snap = measurePctSize(el.id);

    setDrag({
      id: el.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: el.x ?? 0,
      originY: el.y ?? 0,
      rectWidth: rect.width,
      rectHeight: rect.height,
      wPct: (el.width ?? null) ?? snap.w,
      hPct: (el.height ?? null) ?? snap.h,
    });
    onSelect && onSelect(el.id);
  };

  // click outside clears selection
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setDrag(null);
      onSelect && onSelect(null);
    }
  };

  // ESC clears selection
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDrag(null);
        onSelect && onSelect(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  // rect helpers (with frozen w/h while dragging)
  const rectFor = (el) => {
    if (!el) return { x: 0, y: 0, w: 0, h: 0 };

    if (drag && drag.id === el.id) {
      return { x: el.x || 0, y: el.y || 0, w: drag.wPct || 0, h: drag.hPct || 0 };
    }

    let w = el.width ?? null;
    let h = el.height ?? null;

    if (w == null || h == null) {
      const m = measurePctSize(el.id);
      w = w == null ? m.w : w;
      h = h == null ? m.h : h;
    }

    if ((w ?? 0) === 0 || (h ?? 0) === 0) {
      if (el.type === "text") {
        const estH = ((el.fontSize || 12) * 1.4 * 100) / (canvasHeight || 1);
        w = w || 50;
        h = h || Math.max(4, estH);
      } else {
        w = w || 20;
        h = h || 20;
      }
    }

    return { x: el.x || 0, y: el.y || 0, w, h };
  };

  const overlaps = (a, b) =>
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;

  useEffect(() => {
    if (!drag) return;

    const handleMove = (e) => {
      if (!onElementChange) return;
      const el = elements.find((x) => x.id === drag.id);
      if (!el) return;

      const dxPx = e.clientX - drag.startClientX;
      const dyPx = e.clientY - drag.startClientY;

      const dxPct = (dxPx / drag.rectWidth) * 100;
      const dyPct = (dyPx / drag.rectHeight) * 100;

      const cur = rectFor(el);

      let nextX = clamp(drag.originX + dxPct, 0, Math.max(0, 100 - cur.w));
      let nextY = clamp(drag.originY + dyPct, 0, Math.max(0, 100 - cur.h));

      const proposed = { x: nextX, y: nextY, w: cur.w, h: cur.h };
      const others = elements
        .filter((o) => o.id !== el.id)
        .map((o) => rectFor(o));

      const collides = others.some((o) => overlaps(proposed, o));
      if (!collides) {
        if (el.x !== nextX || el.y !== nextY) onElementChange({ ...el, x: nextX, y: nextY });
        return;
      }

      // try X-only
      const onlyX = { x: nextX, y: el.y || 0, w: cur.w, h: cur.h };
      const collidesX = others.some((o) => overlaps(onlyX, o));
      if (!collidesX) {
        if (el.x !== nextX) onElementChange({ ...el, x: nextX, y: el.y || 0 });
        return;
      }

      // try Y-only
      const onlyY = { x: el.x || 0, y: nextY, w: cur.w, h: cur.h };
      const collidesY = others.some((o) => overlaps(onlyY, o));
      if (!collidesY) {
        if (el.y !== nextY) onElementChange({ ...el, x: el.x || 0, y: nextY });
        return;
      }
      // both collide → no-op
    };

    const handleUp = () => setDrag(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [drag, elements, onElementChange, canvasHeight]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        className="relative border border-slate-300 shadow-sm rounded-lg overflow-hidden"
        style={{ width: canvasWidth, height: canvasHeight, backgroundColor: bgColor }}
      >
        {elements.map((el) => {
          const isSelected = el.id === selectedId;

          const commonStyle = {
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: el.type !== "text" && el.width ? `${el.width}%` : "auto",
            height: el.height ? `${el.height}%` : "auto",
            boxSizing: "border-box",
          };

          const baseRing = isSelected ? "ring-2 ring-orange-500" : "ring-0 ring-transparent";

          if (el.type === "qr") {
            return (
              <div
                key={el.id}
                ref={setNodeRefFor(el.id)}
                style={commonStyle}
                className={[
                  "flex items-center justify-center select-none",
                  "bg-white border border-slate-300 rounded-md shadow-sm",
                  "cursor-grab active:cursor-grabbing",
                  baseRing,
                ].join(" ")}
                onMouseDown={(e) => startDrag(e, el)}
                onClick={() => onSelect && onSelect(el.id)}
              >
                {url ? (
                  <QRCodeSVG value={url} size={256} className="w-full h-full p-1" />
                ) : (
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">QR</span>
                )}
              </div>
            );
          }

          if (el.type === "text") {
            const isTitle =
              (el.id || "").toLowerCase().startsWith("title") ||
              (el.text || "").toLowerCase().includes("{{eventname}}");

            const color = el.color || defaultText;
            const xPct = el.x ?? 0;
            // prevent overflow to the right: max width until right edge
            const maxWidthPct = Math.max(10, 100 - xPct - 1);

            return (
              <div
                key={el.id}
                ref={setNodeRefFor(el.id)}
                style={{
                  ...commonStyle,
                  display: "inline-block",
                  maxWidth: `${maxWidthPct}%`,
                  width: "auto",
                }}
                className={[
                  "px-2 py-1 select-none rounded-sm",
                  "cursor-grab active:cursor-grabbing",
                  baseRing,
                ].join(" ")}
                onMouseDown={(e) => startDrag(e, el)}
                onClick={() => onSelect && onSelect(el.id)}
              >
                <div
                  className="leading-tight break-words"
                  style={{
                    fontSize: el.fontSize || (isTitle ? 18 : 12),
                    color,
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                    fontFamily: isTitle
                      ? '"Cormorant Garamond", serif'
                      : '"DM Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
                    fontWeight: isTitle ? 700 : 500,
                    letterSpacing: isTitle ? "0.2px" : "0",
                  }}
                >
                  {resolveText(el.text)}
                </div>
              </div>
            );
          }

          if (el.type === "branding") {
            return (
              <div
                key={el.id}
                ref={setNodeRefFor(el.id)}
                style={commonStyle}
                className={[
                  "flex items-center justify-center text-[10px] uppercase tracking-wide select-none",
                  "bg-gradient-to-r from-orange-500 to-amber-400 text-white",
                  "rounded-b-lg shadow-sm",
                ].join(" ")}
              >
                powered by MemoReels
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
