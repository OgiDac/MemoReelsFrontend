// src/pages/EventPage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchEventById, fetchEventOverview } from "../store/slices/eventSlice";
import { Calendar, MapPin, Heart, ArrowLeft } from "lucide-react";
import Overview from "../components/Overview";
import EventQrModal from "../components/EventQrModal";
import { closeQr } from "../store/slices/eventsSlice";
import AlbumsTab from "../components/AlbumsTab";

function RequestedPhotosTab() {
    return (
        <div className="w-full">
            {/* example placeholder section */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 text-gray-600">
                ⬆️ Requested photos placeholder...
            </div>
        </div>
    );
}

export default function EventPage() {
    const { eventId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { event, status, overview, overviewStatus } = useSelector((s) => s.event);
    const { isQrOpen, qrCodeValue } = useSelector((s) => s.events);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";
    const setActiveTab = (tab) =>
        setSearchParams(prev => {
            const sp = new URLSearchParams(prev);
            sp.set("tab", tab);
            return sp;
        });

    // ensure URL always has ?tab=...
    useEffect(() => {
        if (!searchParams.get("tab")) {
            setSearchParams({ tab: "overview" }, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (eventId) {
            dispatch(fetchEventById(eventId));
            dispatch(fetchEventOverview(eventId));
        }
    }, [dispatch, eventId]);

    if (status === "loading") return <p className="text-gray-500 p-6">Loading event details...</p>;
    if (!event) return <p className="text-gray-500 p-6">Event not found.</p>;

    return (
        <><div className="w-full max-w-5xl mx-auto px-4 mt-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => navigate("/home")}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition w-fit cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-medium">Back to Events</span>
                    </button>

                    <div className="flex items-center gap-2 mt-1">
                        <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                            {event.name}
                        </h1>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span>
                            {new Date(event.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                        <span>•</span>
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span>{event.location}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex mt-8 mb-6">
                <div className="flex space-x-2 bg-gray-100 rounded-full p-1 shadow-sm">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === "overview"
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow"
                            : "text-gray-700 hover:text-orange-600"}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("albums")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === "albums"
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow"
                            : "text-gray-700 hover:text-orange-600"}`}
                    >
                        Photo Albums
                    </button>
                    <button
                        onClick={() => setActiveTab("requested")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === "requested"
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow"
                            : "text-gray-700 hover:text-orange-600"}`}
                    >
                        Requested Photos
                    </button>
                </div>
            </div>

            {/* Tab Content (no outer paper) */}
            <div className="mb-10">
                {activeTab === "overview" && (
                    <Overview
                        overviewData={overview}
                        eventDetails={event}
                        isLoading={overviewStatus === "loading"} />
                )}
                {activeTab === "albums" && <AlbumsTab eventId={eventId} />}
                {activeTab === "requested" && <RequestedPhotosTab />}
            </div>
        </div><EventQrModal
                open={isQrOpen}
                onClose={() => dispatch(closeQr())}
                id={qrCodeValue?.id}
                code={qrCodeValue?.code} /></>

    );
}
