import { useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { openCreateModal, closeCreateModal } from "../store/slices/eventsSlice";
import { useNavigate } from "react-router-dom";
import { IconPlus, IconHeart, IconDashboard } from "./Icons";
import CreateEventForm from "./CreateEventForm";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Camera, CameraIcon } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isCreateModalOpen } = useSelector((s) => s.events);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <>
      <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-15 py-2 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/home")}
            >
              <div className="bg-orange-500 p-2 rounded-lg flex items-center justify-center">
                <IconHeart  className="text-white text-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-orange-500">
                  MemoReels
                </span>
                <span className="text-sm text-gray-500 -mt-1">
                  Event Photo Management
                </span>
              </div>
            </div>

            <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-500 text-white rounded-full flex items-center gap-1 shadow-sm">
              <IconDashboard className="text-white text-xs" />
              Photographer Dashboard
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => dispatch(openCreateModal())}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow hover:from-orange-500 hover:to-orange-600 transition font-medium text-sm"
                >
                  <IconPlus className="text-white text-xs" />
                  Create New Event
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition font-medium text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-3 py-1.5 rounded-md text-orange-500 border border-orange-500 hover:bg-orange-50 transition font-medium text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-3 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition font-medium text-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { }}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="bg-white rounded-lg border border-gray-200 w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <DialogTitle className="flex items-center gap-2 text-orange-600 font-semibold text-lg">
                    Create New Event
                  </DialogTitle>
                  <button
                    onClick={() => dispatch(closeCreateModal())}
                    className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <div className="p-6">
                  <CreateEventForm onClose={() => dispatch(closeCreateModal())} />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
