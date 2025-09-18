import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signup } from "../store/slices/authSlice";
import { Navigate, Link } from "react-router-dom";

export default function SignupPage() {
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const dispatch = useDispatch();
    const { isAuthenticated, status, error } = useSelector((s) => s.auth);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(signup(form));
    };

    if (isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    return (
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 mx-auto">
            <h2 className="text-2xl font-bold text-orange-500 mb-6 text-center">
                Create Your Account
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />

                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full py-3 rounded-md bg-orange-500 text-white font-medium hover:bg-orange-600 transition disabled:opacity-50"
                >
                    {status === "loading" ? "Loading..." : "Sign Up"}
                </button>
            </form>

            {status === "failed" && error && (
                <p className="text-red-500 mt-3 text-center">{error}</p>
            )}

            <p className="mt-6 text-sm text-gray-500 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-500 hover:underline">
                    Login here
                </Link>
            </p>
        </div>
    );
}
