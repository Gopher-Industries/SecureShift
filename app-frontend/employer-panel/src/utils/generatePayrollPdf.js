import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

const formatCurrency = (amount) => {
  return "$" + (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d
    .toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, "-");
};

export const generatePayrollPDF = (records = [], monthName = "", year = new Date().getFullYear()) => {
  if (!records || records.length === 0) {
    throw new Error(`No payroll data available to export for ${monthName}.`);
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedDate = new Date().toLocaleDateString();

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("SecureShift Payroll Summary Report", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Pay Period: ${monthName} ${year}`, 14, 27);
  doc.text(`Generated On: ${generatedDate}`, 14, 32);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 36, 196, 36);

  const tableHeaders = ["Guard Name", "Shift Date", "Location", "Hours", "Pay Rate", "Shift Total"];
  const tableRows = [];
  let grandTotal = 0;

  records.forEach((record) => {
    const entries = (record.entries || []).filter(
      (e) => e.attendanceStatus === "present" || e.actualHours > 0
    );

    if (entries.length === 0) return;

    entries.forEach((entry) => {
      const hours = entry.actualHours ?? entry.scheduledHours ?? 0;
      const rate = entry.payRate ? `$${entry.payRate}/hr` : "—";
      const shiftTotal = entry.totalPay || 0;

      tableRows.push([
        record.guardName || "Unknown Guard",
        formatDate(entry.shiftDate),
        entry.location || "—",
        hours,
        rate,
        formatCurrency(shiftTotal),
      ]);
    });

    grandTotal += record.grossPay || 0;
  });

  if (tableRows.length === 0) {
    throw new Error(`No completed shift entries available to export for ${monthName}.`);
  }

  tableRows.push([
    { content: "GRAND TOTAL", colSpan: 5, styles: { fontStyle: "bold", halign: "right" } },
    { content: formatCurrency(grandTotal), styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
  ]);

  autoTable(doc, {
    startY: 42,
    head: [tableHeaders],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} - SecureShift Confidential Record`, 14, doc.internal.pageSize.height - 10);
  }

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`SecureShift_Payroll_${monthName}_${fileDate}.pdf`);
};
