// src/pages/EventStickerPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStickerTemplate,
  fetchStickerEventInfo,
  resetToDefault,
  saveStickerTemplate,
} from "../store/slices/stickerTemplateSlice";
import { ArrowLeft } from "lucide-react";
import StickerEditor from "../components/sticker/StickerEditor";

export default function EventStickerPage() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    template: storedTemplate,
    loading: templateLoading,
    eventInfo,
    eventLoading,
    eventError,
  } = useSelector((s) => s.stickerTemplate);

  const [localTemplate, setLocalTemplate] = useState(null);

  useEffect(() => {
    if (eventId) {
      dispatch(fetchStickerTemplate(eventId));
      dispatch(fetchStickerEventInfo(eventId));
    }
  }, [dispatch, eventId]);

  useEffect(() => {
    if (storedTemplate) setLocalTemplate(storedTemplate);
  }, [storedTemplate]);

  const handleReset = () => dispatch(resetToDefault());
  const handleSave = () => {
    if (!localTemplate || !eventId) return;
    dispatch(saveStickerTemplate({ eventId, template: localTemplate }));
  };

  if ((templateLoading || eventLoading) && !localTemplate && !eventInfo) {
    return <div className="p-6 text-gray-500">Loading sticker editor...</div>;
  }

  if (eventError || !eventInfo) {
    return (
      <div className="p-6 text-gray-500">
        Event not found.
        <button
          onClick={() => navigate("/home")}
          className="ml-2 text-orange-600 underline text-sm"
        >
          Back to events
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* header row: back link (left) + actions (right) */}
      <div className="max-w-6xl mx-auto px-4 mt-4 mb-2 flex items-center justify-between gap-3">
        <Link
          to={`/events/${eventId}`}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Event</span>
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-sm rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow hover:from-orange-600 hover:to-amber-600"
          >
            Save
          </button>
        </div>
      </div>

      <StickerEditor
        template={localTemplate}
        event={eventInfo}
        onTemplateChange={setLocalTemplate}
      />
    </div>
  );
}
