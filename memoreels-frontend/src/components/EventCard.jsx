import { Calendar, MapPin, Camera, QrCode } from "lucide-react";

export default function EventCard({ event }) {
    return (
        <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden border border-gray-200 w-full max-w-sm">
            {/* Top bar / accent */}
            <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-500" />

            {/* Content */}
            <div className="p-5 flex flex-col gap-3 text-left">
                {/* Title */}
                <h3
                    className="text-2xl font-heading font-semibold 
             bg-gradient-to-r from-orange-600 to-amber-600 
             bg-clip-text text-transparent text-center"
                >
                    {event.name}
                </h3>


                {/* Date */}
                <div className="flex items-center text-sm text-gray-600 gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span>
                        {new Date(event.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                    </span>
                </div>

                {/* Location */}
                <div className="flex items-center text-sm text-gray-600 gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span>{event.location}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex flex-col items-center justify-center border rounded-lg py-2 bg-orange-50/40">
                        <Camera className="h-5 w-5 text-orange-500 mb-1" />
                        <span className="text-sm font-semibold text-gray-800">
                            {event.photos || 0}
                        </span>
                        <span className="text-xs text-gray-500">Photos</span>
                    </div>

                    <div className="flex flex-col items-center justify-center border rounded-lg py-2 bg-orange-50/40">
                        <QrCode className="h-5 w-5 text-orange-500 mb-1" />
                        <span className="text-sm font-semibold text-gray-800">
                            {event.code}
                        </span>
                        <span className="text-xs text-gray-500">Code</span>
                    </div>
                </div>

                {/* Button */}
                <button className="mt-4 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow hover:from-orange-500 hover:to-orange-600 hover:shadow-md transition">
                    Manage Event
                </button>
            </div>
        </div>
    );
}
