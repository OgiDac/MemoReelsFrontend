import { useDispatch, useSelector } from "react-redux";
import {
  updateEventForm,
  resetEventForm,
  setEventFormStep,
  validateEventCode,
  createEvent,
  fetchEventsStats,
  fetchEventsList,
} from "../store/slices/eventsSlice";

export default function CreateEventForm({ onClose }) {

  const Req = () => <span className="text-red-500 ml-0.5">*</span>;

  const dispatch = useDispatch();
  const { eventForm, eventFormStep, creating, validating, isCodeValid } = useSelector(
    (s) => s.events
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    // sve što ide u "code" polje upisujemo uppercase
    let finalValue = value;
    if (name === "code") finalValue = value.toUpperCase().trim();
    if (name === "expectedGuests") {
      finalValue = value.replace(/\D/g, ""); // digits only
      if (finalValue.length > 5) finalValue = finalValue.slice(0, 5);
    }
    dispatch(updateEventForm({ field: name, value: finalValue }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    dispatch(setEventFormStep(2));
  };

  const handleBack = () => {
    dispatch(setEventFormStep(1));
  };

  const handleValidate = async () => {
    await dispatch(validateEventCode(eventForm.code));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createEvent());
    if (createEvent.fulfilled.match(result)) {
      dispatch(fetchEventsStats());
      dispatch(fetchEventsList());
      dispatch(resetEventForm());
      onClose();
    }
  };

  return (
    <form
      onSubmit={eventFormStep === 1 ? handleNext : handleSubmit}
      className="w-full space-y-5"
    >
      {eventFormStep === 1 && (
        <>
          {/* Event Title */}
          <div className="flex flex-col text-left">
            <label className="text-sm font-semibold mb-1 text-gray-700">
              Event Title <Req />
            </label>
            <input
              type="text"
              name="name"
              value={eventForm.name}
              onChange={handleChange}
              placeholder="Spring Gala 2025"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          {/* Date & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="flex flex-col text-left">
              <label className="text-sm font-semibold mb-1 text-gray-700">
                Event Date  <Req />
              </label>
              <input
                type="date"
                name="date"
                value={eventForm.date || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-2 
                           focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>

            {/* Venue */}
            <div className="flex flex-col text-left">
              <label className="text-sm font-semibold mb-1 text-gray-700">
                Venue  <Req />
              </label>
              <input
                type="text"
                name="location"
                value={eventForm.location}
                onChange={handleChange}
                placeholder="The Grand Ballroom"
                className="border border-gray-300 rounded-lg px-3 py-2 
                           focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>
          </div>

          {/* Expected Guests (optional) */}
          <div className="flex flex-col text-left sm:col-span-2">
            <label className="text-sm font-semibold mb-1 text-gray-700">
              Expected Guests
            </label>
            <input
              type="number"
              name="expectedGuests"
              value={eventForm.expectedGuests}
              onChange={handleChange}
              placeholder="e.g. 150"
              inputMode="numeric"
              min={1}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-500 mt-1">Used for planning & overview stats.</p>
          </div>

          {/* Short Description */}
          <div className="flex flex-col text-left">
            <label className="text-sm font-semibold mb-1 text-gray-700">
              Short Description
            </label>
            <textarea
              name="description"
              value={eventForm.description}
              onChange={handleChange}
              placeholder="Evening event with 150 guests..."
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                dispatch(resetEventForm());
                onClose();
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 
                         text-white font-semibold shadow transition 
                         hover:from-orange-500 hover:to-orange-600 hover:shadow-lg"
            >
              Next →
            </button>
          </div>
        </>
      )}

      {eventFormStep === 2 && (
        <>
          {/* Code Field */}
          <div className="flex flex-col text-left">
            <label className="text-sm font-semibold mb-1 text-gray-700">
              Unique Event Code  <Req />
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="code"
                value={eventForm.code}
                onChange={handleChange}
                placeholder="e.g. SJ2025"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 
                           focus:ring-2 focus:ring-orange-400 uppercase tracking-wider"
                required
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={validating === "loading" || !eventForm.code}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 
                           hover:bg-gray-100 transition disabled:opacity-50"
              >
                {validating === "loading" ? "Checking..." : "Check"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Guests will use this code to access the event.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              ← Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  dispatch(resetEventForm());
                  onClose();
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating === "loading" || !isCodeValid}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 
                           text-white font-semibold shadow transition 
                           hover:from-orange-500 hover:to-orange-600 hover:shadow-lg
                           disabled:opacity-50"
              >
                {creating === "loading" ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
