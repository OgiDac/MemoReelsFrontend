import { useEffect, useState } from "react";
import StickerCanvas from "./StickerCanvas";
import StickerSidebar from "./StickerSidebar";

export default function StickerEditor({ template, event, onTemplateChange }) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (template?.elements?.length) {
      const exists = template.elements.find((e) => e.id === selectedId);
      if (!exists) setSelectedId(template.elements[0].id);
    } else {
      setSelectedId(null);
    }
  }, [template]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!template) {
    return (
      <div className="flex w-full h-full items-center justify-center text-sm text-slate-500">
        Sticker template not loaded.
      </div>
    );
  }

  const handleElementChange = (updatedEl) => {
    if (!onTemplateChange) return;
    const next = {
      ...template,
      elements: template.elements.map((el) =>
        el.id === updatedEl.id ? updatedEl : el
      ),
    };
    onTemplateChange(next);
  };

  return (
    <div className="w-full flex items-start gap-6 max-w-6xl mx-auto px-4 py-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-xl px-6 py-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Sticker preview</h2>
              <p className="text-xs text-slate-500">Drag elements on the sticker to move them.</p>
            </div>
          </div>

          <div className="flex items-center justify-center py-4">
            <StickerCanvas
              template={template}
              event={event}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onElementChange={handleElementChange}
            />
          </div>
        </div>
      </div>

      <aside className="w-80 shrink-0">
        <div className="border border-slate-200 bg-white rounded-xl p-4 text-sm">
          <StickerSidebar
            template={template}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onElementChange={handleElementChange}
            onTemplateChange={onTemplateChange}
          />
        </div>
      </aside>
    </div>
  );
}
