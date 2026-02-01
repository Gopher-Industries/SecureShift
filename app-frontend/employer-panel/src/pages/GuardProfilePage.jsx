import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import http from "../lib/http";

export default function GuardProfilePage() {
  const { guardId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await http.get(`/guards/${guardId}/profile`);
        setData(res.data);
      } catch (err) {
        setError("Failed to load guard profile");
      } finally {
        setLoading(false);
      }
    }

    if (guardId) fetchData();
  }, [guardId]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Guard Profile</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
