import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="w-full px-15 pt-10">
        <Outlet />
      </div>
    </div>
  );
}
