import React, { useEffect, useState } from 'react';
import api from '../api/api';

// Temporary fallback data - remove once GET /api/v1/faqs is live and verified (FE 005, step 5)
const fallbackFaqs = [
  {
    _id: 'fallback-1',
    question: 'How do I create a new shift?',
    answer: 'Go to the Create Shift page from the dashboard and fill in the shift details.',
    category: 'Shifts',
    displayOrder: 1,
  },
  {
    _id: 'fallback-2',
    question: 'How do I reset my password?',
    answer: 'Use the Forgot password link on the login page to receive a reset email.',
    category: 'Account',
    displayOrder: 2,
  },
];

export default function Faq() {
  const [faqs, setFaqs] = useState(fallbackFaqs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api.get('/faqs')
      .then((res) => {
        // BE 022 contract: a successful response is always an array (possibly
        // empty when there are no active FAQs). Only treat it as "no data"
        // if it's not an array - an empty array is a valid, real result and
        // should replace the fallback list instead of being ignored.
        if (isMounted && Array.isArray(res.data)) {
          setFaqs(res.data);
          setUsedFallback(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Unable to load latest FAQs, showing default list.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedFaqs = [...faqs].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Frequently Asked Questions</h1>
        {loading && <p style={styles.paragraph}>Loading FAQs...</p>}
        {error && <p style={styles.paragraph}>{error}</p>}
        {!loading && !error && !usedFallback && sortedFaqs.length === 0 && (
          <p style={styles.paragraph}>No FAQs are available right now.</p>
        )}
        {sortedFaqs.map((faq) => (
          <div key={faq._id} style={styles.faqItem}>
            <h2 style={styles.heading}>{faq.question}</h2>
            <p style={styles.paragraph}>{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 20px' },
  container: { maxWidth: '800px', margin: '0 auto' },
  title: { fontSize: '28px', marginBottom: '20px' },
  heading: { fontSize: '18px', marginTop: '20px' },
  paragraph: { fontSize: '15px', lineHeight: 1.6 },
  faqItem: { marginBottom: '16px' },
};
