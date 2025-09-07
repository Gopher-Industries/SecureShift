// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const footerLinks = [
    { title: 'Privacy Policy', link: '/privacy-policy' },
    { title: 'Terms and Conditions', link: '/terms-and-condition' },
    { title: 'FAQ’s', link: '/faqs' },
    { title: 'Contact Us', link: '/contact-us' }
  ];

  return (
    <footer style={styles.footer}>
      {footerLinks.map((item, index) => (
        <span key={index}>
          <Link to={item.link} style={styles.link}>{item.title}</Link>
          {index < footerLinks.length - 1 && ' | '}
        </span>
      ))}
    </footer>
  );
}

const styles = {
  footer: {
    width: '100%',
    backgroundColor: '#072261',
    color: '#fff',
    textAlign: 'center',
    padding: '10px 0',
    fontSize: '14px',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    margin: '0 8px',
  }
};
