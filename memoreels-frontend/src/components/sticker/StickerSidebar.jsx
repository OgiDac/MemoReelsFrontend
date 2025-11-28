import { useEffect, useMemo, useState } from "react";
import { STICKER_PRESETS } from "../../constants/stickerDefaults";

const SWATCHES = [
  "#111827", "#374151", "#6B7280", "#000000", "#FFFFFF",
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
];

const BG_SWATCHES = [
  "#FFFFFF", "#F8FAFC", "#FFF7ED", "#FEF3C7", "#F3F4F6",
  "#E5E7EB", "#111827",
];

export default function StickerSidebar({
  template,
  selectedId,
  onSelect,
  onElementChange,
  onTemplateChange,
}) {
  const allElements = Array.isArray(template?.elements) ? template.elements : [];
  const elements = allElements.filter((e) => e.type !== "branding");
  const selected = elements.find((e) => e.id === selectedId) || null;

  const getElementLabel = (el) => {
    if (el.type === "qr") return "QR code";
    if (el.type === "text") {
      const t = (el.text || "").toLowerCase();
      if (t.includes("{{eventname}}")) return "Title";
      if (t.includes("{{accesscode}}")) return "Access code";
      if (t.includes("{{location}}")) return "Location";
      if ((el.id || "").startsWith("title")) return "Title";
      if ((el.id || "").startsWith("code")) return "Access code";
      if ((el.id || "").startsWith("location")) return "Location";
      return "Text";
    }
    return "Element";
  };

  // token-aware editor for TEXT
  const tokenRegex = useMemo(() => /{{\w+}}/g, []);
  const parsed = useMemo(() => {
    if (!selected || selected.type !== "text") return null;
    const text = selected.text || "";
    const tokens = text.match(tokenRegex) || [];
    const segments = text.split(tokenRegex);
    return { tokens, segments };
  }, [selected, tokenRegex]);

  const [segValues, setSegValues] = useState(parsed?.segments || []);
  useEffect(() => {
    if (parsed?.segments) setSegValues(parsed.segments);
    else setSegValues([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, parsed?.segments?.join("\u0001")]);

  const rebuildFromSegments = (segs) => {
    if (!parsed) return "";
    const out = [];
    for (let i = 0; i < Math.max(segs.length, parsed.tokens.length); i++) {
      if (i < segs.length) out.push(segs[i]);
      if (i < parsed.tokens.length) out.push(parsed.tokens[i]);
    }
    return out.join("");
  };

  const handleSegChange = (idx, value) => {
    if (!selected || selected.type !== "text") return;
    const next = segValues.slice();
    next[idx] = value;
    setSegValues(next);
    onElementChange?.({ ...selected, text: rebuildFromSegments(next) });
  };

  const updateSelected = (patch) => {
    if (!selected) return;
    onElementChange?.({ ...selected, ...patch });
  };

  const pickTextColor = (hex) => {
    if (!selected || selected.type !== "text") return;
    onElementChange?.({ ...selected, color: hex });
  };

  const bg = template?.theme?.background || template?.paper?.bgColor || "#FFFFFF";
  const setBackground = (hex) => {
    if (!onTemplateChange) return;
    const next = {
      ...template,
      theme: { ...(template?.theme || {}), background: hex },
      paper: { ...(template?.paper || {}), bgColor: hex }, // keep both in sync
    };
    onTemplateChange(next);
  };

  const isActivePreset = (p) => template?.meta?.key && p.meta?.key && template.meta.key === p.meta.key;

  const MiniPreview = ({ preset }) => {
    const bgPreview = preset.theme?.background ?? preset.paper?.bgColor ?? "#fff";
    return (
      <div
        className="relative w-full rounded border border-slate-200 overflow-hidden"
        style={{ height: 80, background: bgPreview }}
      >
        {/* draw elements as shapes */}
        {preset.elements.map((e) => {
          if (e.type === "branding") {
            return (
              <div
                key={e.id}
                className="absolute left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-400"
                style={{ bottom: `${100 - (e.y + e.height)}%`, height: `${e.height || 6}%` }}
              />
            );
          }
          const style = {
            position: "absolute",
            left: `${e.x}%`,
            top: `${e.y}%`,
            width: e.type !== "text" && e.width ? `${e.width}%` : "40%",
            height: e.height ? `${e.height}%` : "10%",
          };
          if (e.type === "qr") {
            return (
              <div
                key={e.id}
                style={style}
                className="bg-white border border-slate-300 rounded-[3px]"
                title="QR"
              />
            );
          }
          if (e.type === "text") {
            return (
              <div key={e.id} style={style} className="flex flex-col gap-1">
                <div className="h-2 rounded bg-slate-400/70" />
                <div className="h-2 w-3/5 rounded bg-slate-300/80" />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preset picker (minimal previews, no text labels) */}
      <div className="mb-4">
        <div className="text-sm font-semibold text-slate-800 mb-2">Layouts</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STICKER_PRESETS.map((p) => {
            const active = isActivePreset(p);
            return (
              <button
                key={p.meta.key}
                type="button"
                onClick={() => {
                  const next = {
                    ...p,
                    theme: { ...(p.theme || {}), background: p.theme?.background ?? p.paper?.bgColor ?? "#FFFFFF" },
                    paper: { ...(p.paper || {}), bgColor: p.paper?.bgColor ?? p.theme?.background ?? "#FFFFFF" },
                  };
                  onTemplateChange?.(next);
                  const first = (next.elements || []).find(e => e.type !== "branding");
                  if (first) onSelect?.(first.id);
                }}
                className={[
                  "shrink-0 w-32 rounded-lg p-2 border transition focus:outline-none",
                  active ? "border-orange-400 ring-2 ring-orange-200" : "border-slate-200 hover:border-orange-300",
                  "bg-white hover:shadow-sm",
                ].join(" ")}
                title={p.meta.name}
              >
                <MiniPreview preset={p} />
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-800 mb-3">Elements</h2>

      <div className="flex-1 overflow-auto space-y-1 mb-4">
        {elements.map((el) => (
          <button
            key={el.id}
            type="button"
            onClick={() => onSelect?.(el.id)}
            className={[
              "w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs border transition",
              el.id === selectedId
                ? "border-orange-400 bg-orange-50 text-slate-900 shadow-sm"
                : "border-gray-200 bg-white hover:bg-gray-50",
            ].join(" ")}
          >
            <span className="font-medium">{getElementLabel(el)}</span>
          </button>
        ))}
        {!elements.length && <div className="text-xs text-slate-400">No elements.</div>}
      </div>

      {/* Background */}
      <div className="border-t border-gray-200 pt-3 mb-3">
        <div className="text-xs font-semibold text-slate-800 mb-2">Background</div>
        <div className="flex flex-wrap gap-2">
          {BG_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBackground(c)}
              className="w-6 h-6 rounded shadow ring-1 ring-black/10"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <label className="w-6 h-6 rounded shadow ring-1 ring-black/10 overflow-hidden cursor-pointer">
            <input
              type="color"
              className="w-8 h-8 -m-1 p-0 border-0 cursor-pointer"
              value={bg}
              onChange={(e) => setBackground(e.target.value)}
              title="Pick color"
            />
          </label>
        </div>
      </div>

      {/* Selected element editor */}
      <div className="border-t border-gray-200 pt-3 text-xs text-slate-600">
        {selected ? (
          <>
            <div className="font-semibold mb-2 text-slate-800">Selected element</div>

            {selected.type === "text" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Text</label>
                  <div className="space-y-1">
                    {(() => {
                      if (!parsed) return null;
                      const rows = [];
                      const max = Math.max(segValues.length, parsed.tokens.length);
                      for (let i = 0; i < max; i++) {
                        if (i < segValues.length) {
                          rows.push(
                            <textarea
                              key={`seg-${i}`}
                              rows={2}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                              value={segValues[i]}
                              onChange={(e) => handleSegChange(i, e.target.value)}
                              placeholder="Static text…"
                            />
                          );
                        }
                        if (i < parsed.tokens.length) {
                          rows.push(
                            <div
                              key={`tok-${i}`}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-slate-600 border border-gray-200"
                              title="Placeholder"
                            >
                              {parsed.tokens[i]}
                            </div>
                          );
                        }
                      }
                      return rows;
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Font size</label>
                  <input
                    type="number"
                    min={8}
                    max={48}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                    value={selected.fontSize || 12}
                    onChange={(e) =>
                      updateSelected({
                        fontSize: Number(e.target.value) || 12,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Text color</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => pickTextColor(c)}
                        className="w-6 h-6 rounded shadow ring-1 ring-black/10"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    <label className="w-6 h-6 rounded shadow ring-1 ring-black/10 overflow-hidden cursor-pointer">
                      <input
                        type="color"
                        className="w-8 h-8 -m-1 p-0 border-0 cursor-pointer"
                        value={selected.color || "#111827"}
                        onChange={(e) => pickTextColor(e.target.value)}
                        title="Pick color"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-slate-400">Select an element to edit.</div>
        )}
      </div>
    </div>
  );
}
