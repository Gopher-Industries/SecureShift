import React, { useEffect, useState } from 'react';
import api from '../api/api';

export default function Faq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  let isMounted = true;

          api.get('/faqs')
  .then((res) => {
    // BE 022 contract: a successful response is always an array (possibly
        // empty when there are no active FAQs). An empty array is a valid
        // result and should be displayed as-is.
        if (isMounted && Array.isArray(res.data)) {
          setFaqs(res.data);
        }
  })
  .catch(() => {
    if (isMounted) {
      setError('Unable to load FAQs right now. Please try again later.');
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
    {!loading && !error && sortedFaqs.length === 0 && (
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
