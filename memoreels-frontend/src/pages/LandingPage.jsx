import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <h1 style={{ fontSize: "48px", color: "#f97316" }}>MemoReels</h1>
      <p style={{ maxWidth: "600px", margin: "20px auto", fontSize: "18px" }}>
        MemoReels is your platform for event photo management.
        Create private spaces for events, share moments with guests,
        and manage photos effortlessly.
      </p>
      <div style={{ marginTop: "30px" }}>
        <Link
          to="/signup"
          style={{
            background: "#f97316",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            marginRight: "12px",
            textDecoration: "none",
          }}
        >
          Sign Up
        </Link>
        <Link
          to="/login"
          style={{
            border: "2px solid #f97316",
            color: "#f97316",
            padding: "12px 24px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Login
        </Link>
      </div>
    </div>
  );
}
