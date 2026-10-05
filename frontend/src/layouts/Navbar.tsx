import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/analyze", label: "Analyze" },
        { to: "/history", label: "History" },
        { to: "/routine", label: "Routine" },
        { to: "/admin", label: "Model Status" },
      ]
    : [
        { to: "/", label: "Home" },
        { to: "/privacy", label: "Privacy" },
      ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3" aria-label="Main navigation">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold text-brand-700 text-lg">
          <Sparkles className="w-6 h-6" aria-hidden="true" />
          SmartSkin
        </Link>

        <button
          className="sm:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="hidden sm:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-brand-700">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="btn-secondary !py-1.5 !px-4 text-sm">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-brand-700">
                Login
              </Link>
              <Link to="/register" className="btn-primary !py-1.5 !px-4 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {open && (
        <div className="sm:hidden border-t border-slate-200 px-4 py-3 flex flex-col gap-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="btn-secondary text-sm w-full">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">
                Login
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-sm w-full">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
