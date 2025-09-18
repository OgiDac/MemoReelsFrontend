import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/slices/authSlice";
import { Navigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const { isAuthenticated, status, error } = useSelector((s) => s.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 mx-auto">
      <h2 className="text-2xl font-bold text-orange-500 mb-6 text-center">
        Login
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          {status === "loading" ? "Loading..." : "Login"}
        </button>
      </form>

      {status === "failed" && error && (
        <p className="text-red-500 mt-3 text-center">{error}</p>
      )}

      <p className="mt-6 text-sm text-gray-500 text-center">
        Don’t have an account?{" "}
        <Link to="/signup" className="text-orange-500 hover:underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
}
