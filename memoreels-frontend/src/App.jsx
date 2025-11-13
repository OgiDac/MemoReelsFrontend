import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="w-full px-5 py-10">
        <Outlet />
      </div>
    </div>
  );
}
