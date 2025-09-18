import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEventsStats,
  fetchEventsList,
  openCreateModal,
} from "../store/slices/eventsSlice";
import { Camera, Calendar, Sparkles, Heart } from "lucide-react";
import EventCard from "../components/EventCard";

export default function HomePage() {
  const dispatch = useDispatch();
  const { stats, status, events, eventsStatus } = useSelector((s) => s.events);

  useEffect(() => {
    dispatch(fetchEventsStats());
    dispatch(fetchEventsList());
  }, [dispatch]);

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div
      className={`flex flex-col justify-between p-6 rounded-xl border shadow-sm hover:shadow-lg transition-shadow ${color.bg} ${color.border} w-full`}
    >
      <div className="flex items-center gap-2 text-sm font-medium mb-3">
        <span className={`${color.text}`}>{icon}</span>
        <span className={`${color.text}`}>{title}</span>
      </div>
      <div
        className={`flex items-start text-3xl font-bold ${color.value} mt-10`}
      >
        {value}
      </div>
      <div
        className={`flex items-start text-sm mt-1 ${color.textSub}`}
      >
        {subtitle}
      </div>
    </div>
  );

  const ShimmerCard = () => (
    <div className="flex flex-col justify-between p-6 rounded-xl shadow-sm w-full h-40 bg-gray-50">
      <div className="h-4 w-28 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse mb-4"></div>
      <div className="h-8 w-16 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse mb-6"></div>
      <div className="h-4 w-24 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
    </div>
  );

  const ShimmerEvent = () => (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6 h-56 flex flex-col justify-between animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
      <div className="h-10 w-full bg-gray-200 rounded"></div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center mt-10 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3 flex items-center justify-center gap-2">
          <Heart className="h-8 w-8 text-orange-500" /> Capture Every Beautiful
          Moment ✨
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Create magical wedding galleries, organize photos in albums, and share
          memories instantly with couples and their guests.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-16">
        {status === "loading" ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Events"
              value={stats.total}
              subtitle="All created events"
              color={{
                bg: "bg-gradient-to-br from-purple-50/70 to-violet-50/70",
                border: "border-violet-200/60",
                text: "text-violet-700",
                value: "text-violet-800",
                textSub: "text-violet-600",
              }}
              icon={<Sparkles className="h-5 w-5" />}
            />

            <StatCard
              title="Upcoming Events"
              value={stats.upcoming}
              subtitle="Ready to capture"
              color={{
                bg: "bg-gradient-to-br from-blue-50/70 to-indigo-50/70",
                border: "border-blue-200/60",
                text: "text-blue-700",
                value: "text-blue-800",
                textSub: "text-blue-600",
              }}
              icon={<Calendar className="h-5 w-5" />}
            />

            <StatCard
              title="Total Photos"
              value={stats.photos?.toLocaleString()}
              subtitle="Memories captured"
              color={{
                bg: "bg-gradient-to-br from-orange-50/70 to-amber-50/70",
                border: "border-orange-200/60",
                text: "text-orange-700",
                value: "text-orange-800",
                textSub: "text-orange-600",
              }}
              icon={<Camera className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Events */}
      <div className="w-full max-w-6xl text-left border-t border-gray-200 pt-10">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-8">
          Your Events
        </h2>
        {eventsStatus === "loading" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ShimmerEvent />
            <ShimmerEvent />
            <ShimmerEvent />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
            <p className="text-gray-500 mb-4">No events created yet.</p>
            <button
              onClick={() => dispatch(openCreateModal())}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow hover:from-orange-500 hover:to-orange-600 hover:shadow-md transition"
            >
              + Create your first wedding
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
