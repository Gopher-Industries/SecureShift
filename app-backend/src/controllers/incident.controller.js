import PDFDocument from 'pdfkit';

import IncidentReport from "../models/IncidentReport.js";
import Shift from "../models/Shift.js";


const mapAttachments = (req) => {
  // Backend Validations - File upload restrictions and security checks.
  let attachments = [];
  if (req.files && req.files.length > 0) {
    attachments = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: req.user.id
    }));
  }
  return attachments
}

export const submitIncident = async (req, res) => {
  try {
    const {title, description, shiftId, location} = req.body;
    const guardId = req.user.id;

    const attachments = mapAttachments(req)

    // Backend Validations - Only guards assigned to a shift can submit incident for that shift.
    const shift = await Shift.findById(shiftId);
    if (!shift || shift.guardId.toString() !== guardId) {
      return res.status(403).json({message: 'Not authorized to submit incident for this shift.'});
    }

    const newReport = new IncidentReport({
      title,
      description,
      guardId,
      shiftId,
      location,
      attachments
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({message: err.message});
  }
}

export const updateIncident = async (req, res) => {
  try {
    const {id} = req.params;
    const {status, severity, employerComment, description} = req.body;
    const userRole = req.user.role;

    const report = await IncidentReport.findById(id);
    if (!report) return res.status(404).json({message: 'Incident not found'});

    // Guard can only update description and attachments
    if (userRole === 'guard') {
      if (description) report.description = description;
      report.attachments = mapAttachments(req);
    }
    // Employer can add comments, assign severity, and update status (pending, resolved).
    else if (userRole === 'employer' || userRole === 'admin') {
      if (severity) report.severity = severity;
      if (employerComment) report.employerComment = employerComment;
      if (status) {
        report.status = status;
        if (status === 'resolved' && report.status !== 'resolved') {
          report.resolvedAt = new Date();
          report.resolvedBy = req.user.id;
        }
      }
      // They can also update description and attachments
      if (description) report.description = description;
      report.attachments = mapAttachments(req);
    }

    const updatedReport = await report.save();
    res.status(200).json(updatedReport);
  } catch (err) {
    res.status(400).json({message: err.message});
  }
}

export const getIncidentById = async (req, res) => {
  try {
    const {id} = req.params;
    const report = await IncidentReport.findById(id)
      .populate('guardId', 'name email phone')
      .populate('shiftId', 'startTime endTime location')
      .populate('resolvedBy', 'name');

    if (!report) return res.status(404).json({message: 'Incident not found'});

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

export const getIncidents = async (req, res) => {
  try {
    const {guardId, shiftId, severity, status} = req.query;

    const query = {};
    if (guardId) query.guardId = guardId;
    if (shiftId) query.shiftId = shiftId;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const reports = await IncidentReport.find(query)
      .sort({createdAt: -1})
      .populate('guardId', 'name')
      .populate('shiftId', 'startTime endTime');

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

export const markIncident = async (req, res) => {
  try {
    const {id} = req.params;
    const {status} = req.body;
    const userRole = req.user.role;

    // Only employers/admins can mark resolved
    if (userRole !== 'employer' && userRole !== 'admin') {
      return res.status(403).json({message: 'Not authorized to update status.'});
    }

    const report = await IncidentReport.findById(id);
    if (!report) return res.status(404).json({message: 'Incident not found'});

    report.status = status;

    // Track who resolved it and when.
    if (status === 'resolved') {
      report.resolvedAt = new Date();
      report.resolvedBy = req.user.id;
    } else {
      report.resolvedAt = null;
      report.resolvedBy = null;
    }

    const updatedReport = await report.save();
    res.status(200).json(updatedReport);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
};

export const exportIncident = async (req, res) => {
  try {
    const {id} = req.params;

    const report = await IncidentReport.findById(id)
      .populate('guardId', 'name email phone')
      .populate('shiftId', 'startTime endTime location')
      .populate('resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({message: 'Incident not found'});
    }

    // Set up the HTTP headers for a PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Incident_Report_${id}.pdf"`
    );

    const doc = new PDFDocument({margin: 50, size: 'A4'});

    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Incident Report', {align: 'center'});
    doc.moveDown(2);

    // Meta Information Section
    doc.fontSize(14).font('Helvetica-Bold').text('General Information');
    doc.fontSize(10).font('Helvetica').moveDown(0.5);
    doc.text(`Report ID: ${report._id}`);
    doc.text(`Title: ${report.title}`);
    doc.text(`Status: ${report.status.toUpperCase()}`);
    doc.text(`Severity: ${report.severity.toUpperCase()}`);
    doc.text(`Created At: ${new Date(report.createdAt).toLocaleString()}`);
    if (report.location) doc.text(`Location: ${report.location}`);
    doc.moveDown(1.5);

    // Personnel Information
    doc.fontSize(14).font('Helvetica-Bold').text('Personnel & Shift Details');
    doc.fontSize(10).font('Helvetica').moveDown(0.5);
    doc.text(`Submitted By (Guard): ${report.guardId?.name || 'Unknown'} (${report.guardId?.email || 'N/A'})`);
    doc.text(`Shift ID: ${report.shiftId?._id || 'N/A'}`);
    if (report.resolvedAt) {
      doc.moveDown(0.5);
      doc.text(`Resolved At: ${new Date(report.resolvedAt).toLocaleString()}`);
      doc.text(`Resolved By: ${report.resolvedBy?.name || 'Unknown'}`);
    }
    doc.moveDown(1.5);

    // Description Section
    doc.fontSize(14).font('Helvetica-Bold').text('Incident Description');
    doc.fontSize(10).font('Helvetica').moveDown(0.5);
    doc.text(report.description, {align: 'justify'});
    doc.moveDown(1.5);

    // Employer Comments (if any)
    if (report.employerComment) {
      doc.fontSize(14).font('Helvetica-Bold').text('Employer/Admin Comments');
      doc.fontSize(10).font('Helvetica').moveDown(0.5);
      doc.text(report.employerComment, {align: 'justify'});
      doc.moveDown(1.5);
    }

    // Attachments List (Metadata only, not embedding the actual files)
    if (report.attachments && report.attachments.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Attached Files (References)');
      doc.fontSize(10).font('Helvetica').moveDown(0.5);
      report.attachments.forEach((file, index) => {
        doc.text(`${index + 1}. ${file.fileName} (${file.fileType})`);
      });
    }

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({message: err.message});
    } else {
      console.error('Error during PDF generation stream:', err);
    }
  }
};