import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventsStats } from "../store/slices/eventsSlice";
import { Camera, Calendar } from "lucide-react";

export default function HomePage() {
  const dispatch = useDispatch();
  const { stats, status } = useSelector((s) => s.events);

  useEffect(() => {
    dispatch(fetchEventsStats());
  }, [dispatch]);

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div
      className={`flex flex-col justify-between p-6 rounded-xl border shadow-sm hover:shadow-lg transition-shadow ${color.bg} ${color.border} w-full`}
    >
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <span className={`${color.text}`}>{icon}</span>
        <span className={`${color.text}`}>{title}</span>
      </div>
      <div className={`text-3xl font-bold ${color.value}`}>{value}</div>
      <div className={`text-sm mt-1 ${color.textSub}`}>{subtitle}</div>
    </div>
  );

  const ShimmerCard = () => (
    <div className="flex flex-col justify-between p-6 rounded-xl border w-full animate-pulse bg-gray-100">
      <div className="h-4 w-24 bg-gray-300 rounded mb-3"></div>
      <div className="h-8 w-16 bg-gray-300 rounded mb-2"></div>
      <div className="h-4 w-20 bg-gray-300 rounded"></div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center text-center mt-10 px-4">
      {/* Header */}
      <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3">
        Capture Every Beautiful Moment ✨
      </h1>
      <p className="text-gray-600 max-w-2xl mb-10 text-lg">
        Create beautiful event galleries, organize photos in albums, and share memories instantly with organizers and guests.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {status === "loading" ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          <>
            <StatCard
              title="Live Events"
              value={stats.live}
              subtitle="Currently active"
              color={{
                bg: "bg-gradient-to-br from-emerald-50/70 to-green-50/70",
                border: "border-emerald-200/60",
                text: "text-emerald-700",
                value: "text-emerald-800",
                textSub: "text-emerald-600",
              }}
              icon={
                <div className="p-1 rounded-full bg-emerald-400">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              }
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
    </div>
  );
}
