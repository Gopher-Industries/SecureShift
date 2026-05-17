import Branch from '../models/Branch.js';              
import { ACTIONS } from '../middleware/logger.js';

/**
 * @desc    Create a new site (employer only)
 * @route   POST /api/v1/branch/site
 * @access  Employer only
 */
export const createSite = async (req, res) => {
  try {
    const { name, code, location } = req.body;
    const existing = await Branch.findOne({
      code,
      employerId: req.user.id,
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({ message: 'Site code already exists' });
    }

    const site = new Branch({
      name,
      code,
      location: {
        line1: location?.line1 || '',
        line2: location?.line2 || '',
        city: location?.city || '',
        state: location?.state || '',
        postcode: location?.postcode || '',
        country: location?.country || '',
      },
      createdBy: req.user.id,
      employerId: req.user.id
    });

    await site.save();
    await req.audit?.log(req.user.id, ACTIONS.SITE_CREATED, {
      siteId: site._id,
    });

    res.status(201).json(site);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create site', error: err.message });
  }
};

/**
 * @desc    Get all sites for logged-in employer
 * @route   GET /api/v1/branch/site
 * @access  Employer only
 */
export const getAllSites = async (req, res) => {
  try {
    const sites = await Branch.find({
      employerId: req.user.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ count: sites.length, sites });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sites', error: err.message });
  }
};

/**
 * @desc    Update a site by ID (employer only)
 * @route   PUT /api/v1/branch/site/:id
 * @access  Employer only
 */
export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Branch.findOne({
      _id: id,
      employerId: req.user.id,
      isActive: true,
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const { name, code, location } = req.body;
    if (name) site.name = name;
    if (code) site.code = code;
    if (location) {
      site.location = {
        line1: location.line1 || site.location.line1,
        line2: location.line2 || site.location.line2,
        city: location.city || site.location.city,
        state: location.state || site.location.state,
        postcode: location.postcode || site.location.postcode,
        country: location.country || site.location.country,
      };
    }

    await site.save();
    await req.audit?.log(req.user.id, ACTIONS.SITE_UPDATED, {
      siteId: id,
      updatedFields: Object.keys(req.body),
    });

    res.status(200).json(site);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update site', error: err.message });
  }
};

/**
 * @desc    Soft-delete a site by ID (employer only)
 * @route   DELETE /api/v1/branch/site/:id
 * @access  Employer only
 */
export const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await Branch.findOne({
      _id: id,
      employerId: req.user.id,
      isActive: true,
    });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    site.isActive = false;
    await site.save();
    await req.audit?.log(req.user.id, ACTIONS.SITE_DELETED, {
      siteId: id,
    });

    res.status(200).json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete site', error: err.message });
  }
};