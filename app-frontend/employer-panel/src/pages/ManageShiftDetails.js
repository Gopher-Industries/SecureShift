import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ManageShiftDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShift = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No auth token found');
        }

        const res = await fetch(
          `http://localhost:5000/api/v1/shifts/${id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }

        const data = await res.json();

        console.log('Fetched shift:', data);

        setShift(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load shift details');
      } finally {
        setLoading(false);
      }
    };

    fetchShift();
  }, [id]);

  if (loading) return <p>Loading shift…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

    const approveGuard = async (guardId) => {
    try {
        const token = localStorage.getItem('token');

        const res = await fetch(
        `http://localhost:5000/api/v1/shifts/${id}/approve`,
        {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ guardId }),
        }
        );

        if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
        }

        // Sprint 1 UX: go back to list
        navigate('/manage-shift');
    } catch (err) {
        console.error(err);
        alert('Failed to approve applicant');
    }
    };

    return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        ← Back
        </button>

        <h1>{shift.title}</h1>
        <p>
        <strong>Status:</strong> {shift.status}
        </p>

        <hr />

        <h2>Applicants</h2>

        {shift.applicants && shift.applicants.length === 0 && (
        <p>No applicants yet.</p>
        )}

        {shift.applicants && shift.applicants.map((applicant) => (
        <div
            key={applicant._id}
            style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            }}
        >
            <div>
            <p style={{ margin: 0, fontWeight: 600 }}>
                {applicant.name}
            </p>
            <p style={{ margin: 0, color: '#666' }}>
                {applicant.email}
            </p>
            </div>

            <button onClick={() => approveGuard(applicant._id)}>
            Approve
            </button>
        </div>
        ))}
    </div>
    );
};

export default ManageShiftDetails;