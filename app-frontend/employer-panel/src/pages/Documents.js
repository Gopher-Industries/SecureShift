// Document expiry tracking page for admin/employer

import React, { useEffect, useMemo, useState } from "react";
import http from "../lib/http";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "valid", label: "Valid" },
  { value: "expiring", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "license", label: "License" },
  { value: "rsa", label: "RSA" },
  { value: "firstAid", label: "First Aid" },
  { value: "id_card", label: "ID Card" },
  { value: "certificate", label: "Certificate" },
  { value: "passport", label: "Passport" },
  { value: "other", label: "Other" },
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await http.get("/documents/admin/documents", {
          params: {
            ...(status ? { status } : {}),
            ...(type ? { type } : {}),
          },
        });

        setDocuments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load documents:", err);
        setError("Failed to load documents. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [status, type, refreshKey]);

  const summary = useMemo(() => {
    return documents.reduce(
      (acc, doc) => {
        acc.total += 1;

        if (doc.status === "valid") acc.valid += 1;
        if (doc.status === "expiring") acc.expiring += 1;
        if (doc.status === "expired") acc.expired += 1;

        return acc;
      },
      { total: 0, valid: 0, expiring: 0, expired: 0 }
    );
  }, [documents]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatType = (value) => {
    const match = TYPE_OPTIONS.find((option) => option.value === value);
    return match ? match.label : value || "—";
  };

  const formatStatus = (value) => {
    const match = STATUS_OPTIONS.find((option) => option.value === value);
    return match ? match.label : value || "—";
  };

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>Document Expiry Tracking</h1>
          <p style={subtitleStyle}>
            Review uploaded guard documents and monitor expiry status.
          </p>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard label="Total Documents" value={summary.total} />
        <SummaryCard label="Valid" value={summary.valid} />
        <SummaryCard label="Expiring Soon" value={summary.expiring} />
        <SummaryCard label="Expired" value={summary.expired} />
      </div>

      <div style={filterRowStyle}>
        <select
          style={selectStyle}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all-status"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          style={selectStyle}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value || "all-type"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          style={resetButtonStyle}
          onClick={() => {
            setStatus("");
            setType("");
          }}
        >
          Reset
        </button>

        <button
          style={resetButtonStyle}
          onClick={() => setRefreshKey((prev) => prev + 1)}
        >
          Refresh
        </button>
      </div>

       {(status || type) && (
         <p style={activeFilterTextStyle}>
          Filters applied: {[status && formatStatus(status), type && formatType(type)]
           .filter(Boolean)
           .join(", ")}
         </p>
       )}


      {loading && <div style={statusMessageStyle}>Loading documents...</div>}

      {error && <div style={errorMessageStyle}>{error}</div>}

      {!loading && !error && (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Guard</th>
                <th style={thStyle}>Document Type</th>
                <th style={thStyle}>Expiry Date</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td style={emptyCellStyle} colSpan="4">
                    {status || type
                      ? "No documents found for the selected filters."
                      : "No documents have been uploaded yet."}
                  </td>
                </tr>
              ) : (
                documents.map((doc, index) => (
                  <tr key={doc._id || index}>
                    <td style={tdStyle}>
                      {doc.guardName ||
                        doc.userName ||
                        doc.employeeName ||
                        doc.user?.name ||
                        "—"}
                    </td>
                    <td style={tdStyle}>{formatType(doc.type)}</td>
                    <td style={tdStyle}>{formatDate(doc.expiryDate)}</td>
                    <td style={tdStyle}>
                      <span style={getStatusBadgeStyle(doc.status)}>
                        {formatStatus(doc.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={summaryCardStyle}>
      <p style={summaryLabelStyle}>{label}</p>
      <p style={summaryValueStyle}>{value}</p>
    </div>
  );
}

const getStatusBadgeStyle = (status) => {
  const base = {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  };

  if (status === "valid") {
    return { ...base, backgroundColor: "#EAFAE7", color: "#2E7D32" };
  }

  if (status === "expiring") {
    return { ...base, backgroundColor: "#FBFAE2", color: "#F57C00" };
  }

  if (status === "expired") {
    return { ...base, backgroundColor: "#FFEBEE", color: "#C62828" };
  }

  return { ...base, backgroundColor: "#F5F5F5", color: "#666" };
};

const pageStyle = {
  padding: "40px",
  maxWidth: "1200px",
  margin: "0 auto",
};

const headerRowStyle = {
  marginBottom: "24px",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0 0 8px 0",
};

const subtitleStyle = {
  margin: 0,
  color: "#666",
  fontSize: "14px",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const summaryCardStyle = {
  backgroundColor: "#EFF4FF",
  borderRadius: "12px",
  padding: "18px 22px",
};

const summaryLabelStyle = {
  margin: "0 0 8px 0",
  fontSize: "14px",
  color: "#1E1E1E",
};

const summaryValueStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "700",
  color: "#1E1E1E",
};

const filterRowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const selectStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "14px",
  backgroundColor: "white",
};

const resetButtonStyle = {
  border: "1px solid #274b93",
  borderRadius: "10px",
  padding: "10px 18px",
  fontSize: "14px",
  backgroundColor: "white",
  color: "#274b93",
  cursor: "pointer",
  fontWeight: "600",
};

const tableWrapperStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "14px 18px",
  backgroundColor: "#F5F7FB",
  fontSize: "14px",
  color: "#374151",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
  padding: "14px 18px",
  fontSize: "14px",
  borderBottom: "1px solid #f0f0f0",
};

const emptyCellStyle = {
  ...tdStyle,
  textAlign: "center",
  color: "#666",
  padding: "32px",
};

const statusMessageStyle = {
  color: "#666",
  fontSize: "14px",
};

const errorMessageStyle = {
  color: "#C62828",
  backgroundColor: "#FFEBEE",
  padding: "12px 16px",
  borderRadius: "10px",
};

const activeFilterTextStyle = {
  margin: "-12px 0 20px 0",
  color: "#666",
  fontSize: "13px",
};