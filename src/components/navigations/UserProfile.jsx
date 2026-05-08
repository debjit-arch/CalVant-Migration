import React, { useState, useEffect, useRef } from "react";
import { LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFramework,
  ALL_FRAMEWORKS,
} from "../../context/FrameworkContex"; // ✅ fixed typo
import CompactFrameworkFilter from "../CompactFrameworkFilter";
const UserProfile = ({ user, handleLogout }) => {
  const [open, setOpen] = useState(false);
  const [frameworkOpen, setFrameworkOpen] = useState(false);
  const modalRef = useRef(null);

const { selectedFrameworks, toggleFramework, isAllSelected, availableFrameworks, frameworkColorMap } = useFramework();



  // ✅ Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpen(false);
        setFrameworkOpen(false);
      }
    };

    const escHandler = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setFrameworkOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, []);

  // ✅ Safe initials
  const getInitials = () => {
    if (!user?.name) return "";
    const parts = user.name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // ✅ Department label logic
  const getDepartmentLabel = () => {
    if (!user) return "";

    const hasGlobalAccess = user.role?.some((role) =>
      ["root", "dpo", "ciso", "aio"].includes(role)
    );

    if (hasGlobalAccess) return "All";

    return user.department?.name || "—";
  };

  // ✅ Framework toggle (no auto-close)
  const handleFrameworkToggle = (fw) => {
    toggleFramework(fw);
  };

  // ─────────────────────────────────────

  const AccordionRow = ({
    icon: Icon,
    label,
    open,
    onToggle,
    children,
  }) => (
    <div>
      <button
        onClick={onToggle}
        className="
          w-full flex items-center gap-2.5
          px-3 py-2.5
          text-xs text-gray-700
          hover:bg-slate-50
          transition-colors duration-150 rounded-md
          border-0 bg-transparent text-left
        "
      >
        <Icon size={15} className="text-gray-400 flex-shrink-0" />
        <span className="flex-1 font-medium">{label}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mr-2 mb-1 bg-slate-50 rounded-md px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );



  // ─────────────────────────────────────

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
      
      {/* Avatar */}
      <div
        onClick={(e) => {
          e.stopPropagation(); // ✅ fix bubbling
          setOpen((prev) => !prev);
        }}
        title="Open profile"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {getInitials()}
      </div>

      {/* Popover */}
      {open && (
        <div
          ref={modalRef}
          style={{
            position: "absolute",
            top: 50,
            right: 0, // ✅ fixed position
            width: 240,
            background: "#fff",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            zIndex: 100,
          }}
        >
          <strong>{user?.name}</strong>

          <div style={{ marginTop: 6 }}>
            Department: {getDepartmentLabel()}
          </div>

          <div>
            Role:{" "}
            {Array.isArray(user?.role)
              ? user.role.join(", ")
              : user?.role}
          </div>

          <div style={{ marginTop: 12 }}>
            <AccordionRow
              icon={ShieldCheck}
              label="Framework Filter"
              open={frameworkOpen}
              onToggle={() =>
                setFrameworkOpen((p) => !p)
              }
            >
              <CompactFrameworkFilter />
            </AccordionRow>
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout}>
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default UserProfile;