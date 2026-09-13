import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { generatePayrollPDF } from "./generatePayrollPdf";

jest.mock("jspdf", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("jspdf-autotable", () => ({
  autoTable: jest.fn(),
}));

const createPdfMock = () => {
  const pdf = {
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    setDrawColor: jest.fn(),
    line: jest.fn(),
    save: jest.fn(),
    internal: {
      getNumberOfPages: jest.fn().mockReturnValue(1),
      pageSize: { height: 297 },
    },
    setPage: jest.fn(),
  };

  jsPDF.mockImplementation(() => pdf);
  return pdf;
};

describe("generatePayrollPDF", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a formatted PDF for completed payroll entries", () => {
    const pdf = createPdfMock();
    const records = [
      {
        guardName: "Alex Guard",
        grossPay: 240,
        entries: [
          {
            attendanceStatus: "present",
            shiftDate: "2026-09-04",
            location: "Main site",
            actualHours: 8,
            payRate: 30,
            totalPay: 240,
          },
        ],
      },
    ];

    generatePayrollPDF(records, "September", 2026);

    expect(autoTable).toHaveBeenCalledWith(
      pdf,
      expect.objectContaining({
        head: [["Guard Name", "Shift Date", "Location", "Hours", "Pay Rate", "Shift Total"]],
        body: expect.arrayContaining([
          ["Alex Guard", "04-09-2026", "Main site", 8, "$30/hr", "$240.00"],
        ]),
      })
    );
    expect(pdf.save).toHaveBeenCalledWith(expect.stringMatching(/SecureShift_Payroll_September_/));
  });

  test("rejects an empty report", () => {
    expect(() => generatePayrollPDF([], "September", 2026)).toThrow(
      "No payroll data available to export for September."
    );
  });

  test("rejects records without completed shift entries", () => {
    createPdfMock();

    expect(() =>
      generatePayrollPDF(
        [{ guardName: "Alex Guard", entries: [{ attendanceStatus: "absent" }] }],
        "September",
        2026
      )
    ).toThrow("No completed shift entries available to export for September.");
  });
});