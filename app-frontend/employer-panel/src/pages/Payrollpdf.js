import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatCurrency(amount) {
  return "$" + (amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d
    .toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, "-");
}

/**
 * Builds and triggers download of a payroll PDF.
 *
 * @param {Object} params
 * @param {Array}  params.records      Guard payroll records (same shape used in Payroll.js).
 * @param {string} params.monthLabel   e.g. "September"
 * @param {number} params.year         e.g. 2026
 * @param {string} [params.companyName] Header title. Defaults to a generic label.
 * @param {string} [params.searchTerm]  If the report was filtered by guard name, shown in the subtitle.
 *
 * @returns {{ success: boolean, fileName?: string, error?: string, message?: string }}
 *   error is one of: "empty" (no completed shifts to report) | "generation" (unexpected failure)
 */
export function generatePayrollPDF({ records, monthLabel, year, companyName = "Payroll Report", searchTerm = "" }) {
  try {
    const guardsWithShifts = (records || [])
      .map((r) => ({
        ...r,
        entries: (r.entries || []).filter(
          (e) => e.attendanceStatus === "present" || e.actualHours > 0
        ),
      }))
      .filter((r) => r.entries.length > 0);

    if (guardsWithShifts.length === 0) {
      return {
        success: false,
        error: "empty",
        message: `No completed shifts to include in the report for ${monthLabel} ${year}.`,
      };
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;
    let cursorY = 50;

    // ---- Header ----
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(companyName, marginX, cursorY);

    cursorY += 20;
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(`Pay Period: ${monthLabel} ${year}`, marginX, cursorY);

    if (searchTerm) {
      cursorY += 15;
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(`Filtered by guard name: "${searchTerm}"`, marginX, cursorY);
      doc.setTextColor(0);
    }

    cursorY += 16;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString("en-AU")}`, marginX, cursorY);
    doc.setTextColor(0);

    cursorY += 22;

    let grandTotal = 0;

    guardsWithShifts.forEach((record, index) => {
      grandTotal += record.grossPay || 0;

      // Keep each guard's name with at least the header row of their table
      if (cursorY > pageHeight - 120) {
        doc.addPage();
        cursorY = 50;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(record.guardName || "Unnamed Guard", marginX, cursorY);
      cursorY += 8;

      const body = record.entries.map((e) => [
        formatDate(e.shiftDate),
        e.location || "—",
        String(e.actualHours ?? e.scheduledHours ?? "—"),
        `$${e.payRate ?? "—"}/hr`,
        formatCurrency(e.totalPay),
      ]);

      autoTable(doc, {
        startY: cursorY,
        margin: { left: marginX, right: marginX },
        head: [["Shift Date", "Location", "Hours", "Pay Rate", "Amount"]],
        body,
        foot: [["", "", "", "TOTAL", formatCurrency(record.grossPay)]],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [39, 75, 147], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [247, 250, 252], textColor: [26, 32, 44], fontStyle: "bold" },
        columnStyles: { 4: { halign: "right" } },
      });

      cursorY = doc.lastAutoTable.finalY + 26;

      // Light divider between guards, except after the last one.
      if (index < guardsWithShifts.length - 1) {
        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, cursorY - 14, pageWidth - marginX, cursorY - 14);
      }
    });

    if (cursorY > pageHeight - 60) {
      doc.addPage();
      cursorY = 50;
    }

    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(`Grand Total: ${formatCurrency(grandTotal)}`, marginX, cursorY);

    //  Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX - 60, pageHeight - 20);
      doc.setTextColor(0);
    }

    const safeMonth = monthLabel.replace(/\s+/g, "_");
    const fileName = `Payroll_${safeMonth}_${year}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (err) {
    console.error("Failed to generate payroll PDF:", err);
    return {
      success: false,
      error: "generation",
      message: "Something went wrong while generating the PDF. Please try again.",
    };
  }
}