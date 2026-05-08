import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import documentationService from "../services/documentationService";
import { Trash2, Archive, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Modal from "../../../components/navigations/Modal";
import { captureActivity, ACTIONS } from "../../../services/activities";

const DOC_API = `${process.env.NEXT_PUBLIC_SP || ""}/doc-service/api/documents`;

async function permanentlyDeleteDocument(id) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(`${DOC_API}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ comment: "Permanently deleted from archive" }),
  });
  if (!res.ok) throw new Error("Permanent delete failed");
}

// ── Sort arrow header ─────────────────────────────────────────────────────
const SortTh = ({ label, sortKey, current, onSort }) => {
  const isActive = current.key === sortKey;
  const isAsc = isActive && current.dir === "asc";
  const isDesc = isActive && current.dir === "desc";
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: "12px 14px",
        textAlign: "center",
        borderBottom: "2px solid #e6e6e6",
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
        background: isActive ? "#fff7ed" : "#f8f9fa",
        transition: "background 0.15s",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 2px 0 #e6e6e6",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
        <span>{label}</span>
        {isAsc ? (
          <ArrowUp size={13} style={{ color: "#f59e0b" }} />
        ) : isDesc ? (
          <ArrowDown size={13} style={{ color: "#f59e0b" }} />
        ) : (
          <ArrowUpDown size={13} style={{ color: "#bbb" }} />
        )}
      </div>
    </th>
  );
};

// ── Static sticky header ──────────────────────────────────────────────────
const StaticTh = ({ children }) => (
  <th
    style={{
      padding: "12px 14px",
      textAlign: "center",
      borderBottom: "2px solid #e6e6e6",
      fontWeight: 600,
      whiteSpace: "nowrap",
      background: "#f8f9fa",
      position: "sticky",
      top: 0,
      zIndex: 10,
      boxShadow: "0 2px 0 #e6e6e6",
    }}
  >
    {children}
  </th>
);

// ─────────────────────────────────────────────────────────────────────────────
const Archived = () => {
  const router = useRouter();
  const user = useMemo(() => JSON.parse(sessionStorage.getItem("user")), []);

  const [allDocs, setAllDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "archivedAt", dir: "desc" });

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    docId: null,
    docName: "",
  });
  const [infoModal, setInfoModal] = useState({ open: false, title: "", message: "" });
  const [working, setWorking] = useState({});

  // ── Load archived documents ─────────────────────────────────────────────
  const loadArchived = useCallback(async () => {
    setLoading(true);
    try {
      const docs = (await documentationService.getDocuments()) || [];
      const archived = docs.filter(
        (d) => d.organization === user?.organization && d.deleted === true
      );
      setAllDocs(archived);
    } catch (err) {
      console.error("Archived load error:", err);
      setAllDocs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: [{ detail: "Documentation · Viewed Archived Policies" }],
      url: "/documentation/archived",
    });
    loadArchived();
  }, [loadArchived]);

  // ── Sort handler ────────────────────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  }, []);

  // ── Filtered + sorted list ──────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let list = [...allDocs];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          (d.name || "").toLowerCase().includes(q) ||
          (d.uploaderName || "").toLowerCase().includes(q) ||
          (d.departmentName || "").toLowerCase().includes(q) ||
          (d.deleteComment || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA, valB;
      switch (sort.key) {
        case "name":
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
          break;
        case "uploaderName":
          valA = (a.uploaderName || "").toLowerCase();
          valB = (b.uploaderName || "").toLowerCase();
          break;
        case "version":
          valA = a.version ?? 0;
          valB = b.version ?? 0;
          break;
        case "archivedAt": {
          const da = a.deletedAt || a.archivedAt || a.updatedAt || a.createdAt;
          const db = b.deletedAt || b.archivedAt || b.updatedAt || b.createdAt;
          valA = da ? new Date(da).getTime() : 0;
          valB = db ? new Date(db).getTime() : 0;
          break;
        }
        case "createdAt":
          valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }
      if (typeof valA === "string") {
        return sort.dir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sort.dir === "asc" ? valA - valB : valB - valA;
    });

    return list;
  }, [allDocs, search, sort]);

  // ── Permanent delete ─────────────────────────────────────────────────────
  const handlePermanentDelete = async () => {
    const { docId, docName } = confirmModal;
    setConfirmModal({ open: false });
    setWorking((p) => ({ ...p, [docId]: true }));
    try {
      await permanentlyDeleteDocument(docId);
      captureActivity({
        action: ACTIONS.DELETE,
        item: `Documentation · Permanently deleted archived policy '${docName}'`,
        url: "/documentation/archived",
      });
      setAllDocs((prev) => prev.filter((d) => d.id !== docId));
      setInfoModal({
        open: true,
        title: "Deleted",
        message: `"${docName}" has been permanently deleted and cannot be recovered.`,
      });
    } catch (err) {
      console.error("Permanent delete error:", err);
      setInfoModal({
        open: true,
        title: "Delete Failed",
        message: "Could not permanently delete the policy. Please try again.",
      });
    } finally {
      setWorking((p) => ({ ...p, [docId]: false }));
    }
  };

  const fmt = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "16px", maxWidth: "1300px", margin: "0 auto", paddingBottom: "80px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .arch-table-wrapper {
          width: 100%;
          overflow-x: auto;
          max-height: 68vh;
          overflow-y: auto;
          border-radius: 8px;
        }
        .arch-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 900px;
        }
        .arch-table tbody tr:hover td { background: #fff8f0 !important; }
      `}</style>

      {/* Nav buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          onClick={() => router.push("/documentation")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "#005FCC",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={() => router.push("/documentation/mld")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "#667eea",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          Go to Policies (MLD)
        </button>
      </div>

      {/* Header banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #64748b 0%, #374151 100%)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          color: "white",
          boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
          <Archive size={32} />
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>Archived Policies</h1>
        </div>
        <p style={{ margin: 0, fontSize: "15px", opacity: 0.85 }}>
          Policies archived from the MLD are stored here. You can permanently delete them when no longer needed.
        </p>
        {!loading && (
          <div style={{ marginTop: "14px", display: "flex", gap: "24px", fontSize: "14px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontWeight: 700 }}>Total Archived:</span> {allDocs.length}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Shown:</span> {filteredDocs.length}
            </div>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, submitter, department or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px 8px 32px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              minWidth: "320px",
              fontSize: "13px",
            }}
          />
        </div>
        <span style={{ fontSize: "13px", color: "#6b7280" }}>
          {filteredDocs.length} of {allDocs.length} archived
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
          border: "1px solid #e9ecef",
        }}
      >
        <h2
          style={{
            color: "#374151",
            marginBottom: "16px",
            fontSize: "17px",
            borderBottom: "3px solid #64748b",
            paddingBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Archive size={18} style={{ color: "#64748b" }} />
          Archive
        </h2>

        <div className="arch-table-wrapper">
          <table className="arch-table">
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <StaticTh>#</StaticTh>
                <SortTh label="Policy Name"     sortKey="name"         current={sort} onSort={handleSort} />
                <SortTh label="CalVant Version" sortKey="version"      current={sort} onSort={handleSort} />
                <SortTh label="Submitted By"    sortKey="uploaderName" current={sort} onSort={handleSort} />
                <StaticTh>Department</StaticTh>
                <SortTh label="Uploaded On"     sortKey="createdAt"    current={sort} onSort={handleSort} />
                <StaticTh>Reason (Remarks)</StaticTh>
                <StaticTh>Actions</StaticTh>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid #64748b",
                        borderTop: "2px solid transparent",
                        animation: "spin 0.8s linear infinite",
                        marginRight: 8,
                        verticalAlign: "middle",
                      }}
                    />
                    Loading archived policies…
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "60px 20px" }}>
                    <Archive
                      size={48}
                      style={{ color: "#d1d5db", marginBottom: "12px", display: "block", margin: "0 auto 12px" }}
                    />
                    <p style={{ fontSize: "16px", fontWeight: 600, color: "#9ca3af", margin: "0 0 4px" }}>
                      {search.trim() ? "No results match your search" : "No Archived Policies"}
                    </p>
                    <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
                      {search.trim()
                        ? "Try a different search term."
                        : "Policies you archive from the MLD will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const isWorking = !!working[doc.id];
                  const archivedDate = doc.deletedAt || doc.archivedAt || doc.updatedAt;

                  return (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: "1px solid #f1f1f1",
                        backgroundColor: "#fafafa",
                        borderLeft: "4px solid #64748b",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* # */}
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: "13px",
                          verticalAlign: "middle",
                        }}
                      >
                        {idx + 1}
                      </td>

                      {/* Policy Name */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: "200px", minWidth: "120px" }}>
                        <span
                          title={doc.name}
                          style={{
                            fontWeight: 600,
                            color: "#374151",
                            fontSize: "13px",
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "180px",
                          }}
                        >
                          {doc.name || "—"}
                        </span>
                        {doc.soaId && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: "#d1fae5",
                              color: "#065f46",
                              border: "1px solid #6ee7b7",
                              padding: "1px 6px",
                              borderRadius: "8px",
                              marginTop: "3px",
                              display: "inline-block",
                            }}
                          >
                            SoA: {doc.soaId}
                          </span>
                        )}
                      </td>

                      {/* CalVant Version */}
                      <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                        {doc.version != null ? (
                          <span
                            style={{
                              background: "#f0f4ff",
                              color: "#3b5bdb",
                              border: "1px solid #c5d4fb",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            v{doc.version}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Submitted By */}
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          color: "#374151",
                          fontSize: "13px",
                        }}
                      >
                        {doc.uploaderName || "—"}
                      </td>

                      {/* Department */}
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        {doc.departmentName || "—"}
                      </td>

                      {/* Uploaded On */}
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        {fmt(doc.createdAt)}
                      </td>

                      {/* Reason */}
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          verticalAlign: "middle",
                          maxWidth: "200px",
                        }}
                      >
                        {doc.deleteComment ? (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              fontStyle: "italic",
                              display: "block",
                              wordBreak: "break-word",
                            }}
                          >
                            "{doc.deleteComment}"
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#d1d5db" }}>—</span>
                        )}
                      </td>

                      {/* Actions — Delete Forever only */}
                      <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "middle" }}>
                        <button
                          disabled={isWorking}
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              docId: doc.id,
                              docName: doc.name || String(doc.id),
                            })
                          }
                          title="Permanently delete"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: isWorking ? "#e5e7eb" : "#ef4444",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: isWorking ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            margin: "0 auto",
                          }}
                        >
                          {isWorking ? (
                            <span
                              style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                border: "2px solid #fff",
                                borderTop: "2px solid transparent",
                                animation: "spin 0.8s linear infinite",
                              }}
                            />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Delete Forever
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={confirmModal.open}
        title="⚠️ Permanently Delete Policy"
        showCancel
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={handlePermanentDelete}
        message={
          <div style={{ fontSize: "14px", color: "#374151" }}>
            <p style={{ marginBottom: "8px" }}>
              Permanently delete <strong>"{confirmModal.docName}"</strong>?
            </p>
            <p style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600, margin: 0 }}>
              ⚠️ This action cannot be undone. The file and all its version history will be permanently removed.
            </p>
          </div>
        }
      />

      {/* ── Info Modal ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={infoModal.open}
        title={infoModal.title}
        showCancel={false}
        onClose={() => setInfoModal({ open: false })}
        onConfirm={() => setInfoModal({ open: false })}
        message={<p style={{ fontSize: "14px", color: "#374151" }}>{infoModal.message}</p>}
      />

      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "white",
          color: "#9ca3af",
          padding: "12px",
          textAlign: "center",
          fontSize: "13px",
          zIndex: 700,
          borderTop: "1px solid #f1f1f1",
        }}
      >
        © {new Date().getFullYear()} CalVant. All rights reserved.
      </footer>
    </div>
  );
};

export default Archived;