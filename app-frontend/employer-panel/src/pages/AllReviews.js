import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import reviewsData from './reviewsData';
import './AllReviews.css';

const Star = ({ filled }) => (
  <svg viewBox="0 0 24 24" className={`all-reviews-star ${filled ? 'filled' : ''}`}>
    <path d="M12 2l3.09 6.28 6.93 1-5 4.86L18.18 22 12 18.56 5.82 22l1.16-7.86-5-4.86 6.93-1L12 2z" />
  </svg>
);

export default function AllReviews() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');

  const filteredReviews = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return reviewsData.filter((review) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        review.name.toLowerCase().includes(normalizedQuery) ||
        review.role.toLowerCase().includes(normalizedQuery) ||
        review.text.toLowerCase().includes(normalizedQuery);

      const matchesRating =
        ratingFilter === 'All' || review.stars >= Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [ratingFilter, searchQuery]);

  return (
    <section className="all-reviews-page" aria-labelledby="all-reviews-title">
      <div className="all-reviews-header">
        <div>
          <h1 id="all-reviews-title">{t('allReviewsTitle')}</h1>
          <p>{t('allReviewsSubtitle')}</p>
        </div>

        <button
          type="button"
          className="all-reviews-back-btn"
          onClick={() => navigate('/employer-dashboard')}
        >
          {t('backDashboard')}
        </button>
      </div>

      <div className="all-reviews-filters" role="region" aria-label="Review filters">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={`${t('search')}...`}
          aria-label="Search reviews"
        />

        <select
          value={ratingFilter}
          onChange={(event) => setRatingFilter(event.target.value)}
          aria-label="Minimum rating"
        >
          <option value="All">{t('all')}</option>
          <option value="5">5★</option>
          <option value="4">4★+</option>
          <option value="3">3★+</option>
        </select>
      </div>

      <div className="all-reviews-summary">
        {filteredReviews.length} {t('showingResults')}
      </div>

      <div className="all-reviews-grid">
        {filteredReviews.map((review, index) => (
          <article key={`${review.name}-${review.role}-${index}`} className="all-reviews-card">
            <div className="all-reviews-card-top">
              <div className="all-reviews-avatar" aria-hidden="true">
                {review.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <div>
                <h2>{review.name}</h2>
                <p>{review.role}</p>
              </div>
            </div>

            <div className="all-reviews-stars" aria-label={`${review.stars} out of 5 stars`}>
              {[0, 1, 2, 3, 4].map((starIndex) => (
                <Star key={starIndex} filled={starIndex < review.stars} />
              ))}
            </div>

            <blockquote>“{review.text}”</blockquote>
            <time>{review.date}</time>
          </article>
        ))}
      </div>

      {filteredReviews.length === 0 && <div className="all-reviews-empty">{t('noData')}</div>}
    </section>
  );
}
