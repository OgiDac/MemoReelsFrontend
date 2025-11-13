// src/components/Overview.jsx
import { Camera, Eye, Folder, QrCode, Heart, Users, Calendar, FileText } from "lucide-react";
import { useDispatch } from "react-redux";
import { openQr } from "../store/slices/eventsSlice";

const StatCard = ({ title, value, icon, gradient, valueColor, iconColor }) => (
    <div className={`rounded-xl border ${gradient} shadow-sm w-full px-5 py-4 flex items-center gap-3`}>
        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${iconColor.bg}`}>
            <span className={`${iconColor.text}`}>{icon}</span>
        </div>
        <div className="flex flex-col leading-tight">
            <span className="text-xs text-gray-500">{title}</span>
            <span className={`text-xl font-semibold ${valueColor}`}>{value}</span>
        </div>
    </div>
);

const AccessCodeCard = ({ code, onShowQr }) => (
    <div className="rounded-xl border bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border-blue-200/60 shadow-sm w-full px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onShowQr}
                className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                aria-label="Show QR code"
                title="Show QR code"
            >
                <QrCode size={16} className="text-blue-600" />
            </button>
            <div className="flex flex-col leading-tight">
                <span className="text-xs text-gray-500">Access Code</span>
                <span className="text-xl font-semibold text-blue-800">{code}</span>
            </div>
        </div>
    </div>
);


// Shimmer
const ShimmerCard = () => (
    <div className="rounded-xl shadow-sm w-full h-20 bg-gray-50 animate-pulse" />
);
const ShimmerDetails = () => (
    <div className="p-8 border rounded-xl shadow-sm animate-pulse h-56" />
);

export default function Overview({ overviewData, eventDetails, isLoading }) {
    const dispatch = useDispatch();
    const openQrModal = () => dispatch(openQr({ id: eventDetails.id, code: overviewData.code }))

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ShimmerCard /><ShimmerCard /><ShimmerCard /><ShimmerCard />
                </div>
                <ShimmerDetails />
            </div>
        );
    }

    if (!overviewData || !eventDetails) {
        return <div className="p-8 text-center text-gray-500">No overview data.</div>;
    }

    return (
        <div className="w-full space-y-8">
            {/* Top stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Photos"
                    value={overviewData.photoCount}
                    icon={<Camera size={16} />}
                    gradient="bg-gradient-to-br from-orange-50/70 to-amber-50/70 border-orange-200/60"
                    valueColor="text-orange-800"
                    iconColor={{ bg: "bg-orange-100", text: "text-orange-600" }}
                />
                <StatCard
                    title="Views"
                    value="340"
                    icon={<Eye size={16} />}
                    gradient="bg-gradient-to-br from-yellow-50/70 to-amber-50/70 border-yellow-200/60"
                    valueColor="text-yellow-800"
                    iconColor={{ bg: "bg-yellow-100", text: "text-yellow-600" }}
                />
                <StatCard
                    title="Albums"
                    value={overviewData.foldersCount}
                    icon={<Folder size={16} />}
                    gradient="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border-blue-200/60"
                    valueColor="text-blue-800"
                    iconColor={{ bg: "bg-blue-100", text: "text-blue-600" }}
                />
                <AccessCodeCard code={overviewData.code} onShowQr={openQrModal} />

            </div>

            {/* Details card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                    <Heart size={18} className="text-orange-500" />
                    Event Details
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {/* Couple */}
                    <div>
                        <div className="text-sm font-semibold text-orange-600">Event Name</div>
                        <div className="text-gray-900 mt-1">{eventDetails?.name || "—"}</div>
                    </div>

                    {/* Expected Guests */}
                    <div>
                        <div className="text-sm font-semibold text-orange-600">Expected Guests</div>
                        <div className="text-gray-900 mt-1">
                            <Users size={16} className="inline mr-2 text-blue-500" />
                            {overviewData.expectedGuests ?? "—"}{overviewData.expectedGuests ? " guests" : ""}
                        </div>
                    </div>

                    {/* Date & Venue */}
                    <div>
                        <div className="text-sm font-semibold text-orange-600">Date & Venue</div>
                        <div className="text-gray-900 mt-1">
                            <Calendar size={16} className="inline mr-2 text-orange-500" />
                            {eventDetails?.date || "—"}
                            {eventDetails?.location ? <span className="text-gray-500"> • {eventDetails.location}</span> : null}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <div className="text-sm font-semibold text-orange-600">Notes</div>
                        <div className="text-gray-700 mt-1">
                            <FileText size={16} className="inline mr-2 text-purple-500" />
                            {overviewData.description || "—"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
