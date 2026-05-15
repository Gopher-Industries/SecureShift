import { ACTIONS } from '../middleware/logger.js';
import {
  approvePayrollRecords,
  exportPayrollCsv,
  exportPayrollPdf,
  getPayrollRecords,
  processPayrollRecords,
} from '../services/payroll.service.js';

const sendError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    message: error.message || fallbackMessage,
  });
};

export const getPayroll = async (req, res) => {
  try {
    const result = await getPayrollRecords(req.query, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, 'Failed to retrieve payroll');
  }
};

export const approvePayroll = async (req, res) => {
  try {
    const payroll = await approvePayrollRecords(req.body.payrollIds, req.user);

    if (req.audit?.log) {
      await req.audit.log(req.user._id || req.user.id, ACTIONS.PAYROLL_APPROVED, {
        payrollIds: req.body.payrollIds,
      });
    }

    return res.status(200).json({
      message: 'Payroll approved successfully',
      payroll,
    });
  } catch (error) {
    return sendError(res, error, 'Failed to approve payroll');
  }
};

export const processPayroll = async (req, res) => {
  try {
    const payroll = await processPayrollRecords(req.body.payrollIds, req.user);

    if (req.audit?.log) {
      await req.audit.log(req.user._id || req.user.id, ACTIONS.PAYROLL_PROCESSED, {
        payrollIds: req.body.payrollIds,
      });
    }

    return res.status(200).json({
      message: 'Payroll processed successfully',
      payroll,
    });
  } catch (error) {
    return sendError(res, error, 'Failed to process payroll');
  }
};

export const downloadPayrollCsv = async (req, res) => {
  try {
    const csv = await exportPayrollCsv(req.query, req.user);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="payroll.csv"');

    return res.status(200).send(csv);
  } catch (error) {
    return sendError(res, error, 'Failed to export payroll CSV');
  }
};

export const downloadPayrollExport = async (req, res) => {
  const format = String(req.query.format || '').toLowerCase();

  if (format === 'csv') {
    return downloadPayrollCsv(req, res);
  }

  if (format === 'pdf') {
    return downloadPayrollPdf(req, res);
  }

  return res.status(400).json({
    message: 'format query parameter must be csv or pdf',
  });
};

export const downloadPayrollPdf = async (req, res) => {
  try {
    const pdfBuffer = await exportPayrollPdf(req.query, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="payroll.pdf"');

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return sendError(res, error, 'Failed to export payroll PDF');
  }
};
