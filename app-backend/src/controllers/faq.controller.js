import { getActiveFaqs } from "../services/faq.service.js";

/**
 * Get all active FAQs
 * @route GET /api/v1/faqs
 * @access Public (no authentication required)
 * @returns {Array} Array of FAQ objects
 */
export const getFaqs = async (req, res) => {
  try {
    const faqs = await getActiveFaqs();

    return res.status(200).json(faqs);
  } catch (error) {
    console.error("FAQ Controller Error:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve FAQs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
