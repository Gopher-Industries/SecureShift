import Faq from "../models/Faq.js";

/**
 * Get all active FAQs sorted by display order
 * @returns {Promise<Array>} Array of active FAQ documents
 */
export const getActiveFaqs = async () => {
  try {
    const faqs = await Faq.find({
      isActive: true,
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return faqs;
  } catch (error) {
    console.error("FAQ Service Error:", error.message);
    throw new Error(`Failed to retrieve FAQs: ${error.message}`);
  }
};
