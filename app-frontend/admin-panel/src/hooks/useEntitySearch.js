import { useEffect, useState } from 'react';
import { getUsers, getShifts, getIncidents } from '../service/adminAPI';
import useDebouncedValue from './useDebouncedValue';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS_PER_GROUP = 5;

function personLabel(person) {
  if (!person) return '';
  return person.name || person.email || '';
}

function matches(haystackParts, query) {
  const haystack = haystackParts.filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query);
}

// Shared cross-entity search used by both GlobalSearch (AP-039) and the
// Command Palette (AP-057), so the fetch/match logic lives in one place.
export default function useEntitySearch(rawQuery) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState({ users: [], guards: [], shifts: [], incidents: [] });

  const query = useDebouncedValue(rawQuery.trim(), 300);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults({ users: [], guards: [], shifts: [], incidents: [] });
      setLoading(false);
      setError('');
      return;
    }

    let active = true;
    const q = query.toLowerCase();

    (async () => {
      try {
        setLoading(true);
        setError('');

        const [usersResult, shiftsResult, incidentsResult] = await Promise.allSettled([
          getUsers(),
          getShifts(),
          getIncidents(),
        ]);

        if (!active) return;

        const usersData =
          usersResult.status === 'fulfilled'
            ? Array.isArray(usersResult.value)
              ? usersResult.value
              : usersResult.value.users || usersResult.value.data || []
            : [];

        const shiftsData =
          shiftsResult.status === 'fulfilled'
            ? Array.isArray(shiftsResult.value)
              ? shiftsResult.value
              : shiftsResult.value.shifts || shiftsResult.value.data || []
            : [];

        const incidentsData =
          incidentsResult.status === 'fulfilled'
            ? Array.isArray(incidentsResult.value)
              ? incidentsResult.value
              : incidentsResult.value.incidents || incidentsResult.value.data || []
            : [];

        const matchedUsers = usersData
          .filter((u) => u.role !== 'guard')
          .filter((u) => matches([u.name, u.email, u._id], q))
          .slice(0, MAX_RESULTS_PER_GROUP);

        const matchedGuards = usersData
          .filter((u) => u.role === 'guard')
          .filter((u) => matches([u.name, u.email, u._id], q))
          .slice(0, MAX_RESULTS_PER_GROUP);

        const matchedShifts = shiftsData
          .filter((s) =>
            matches(
              [s.title, s.status, s._id, personLabel(s.createdBy), personLabel(s.acceptedBy)],
              q
            )
          )
          .slice(0, MAX_RESULTS_PER_GROUP);

        const matchedIncidents = incidentsData
          .filter((i) => matches([i.title, i.type, i.description, i.status, i.severity, i._id], q))
          .slice(0, MAX_RESULTS_PER_GROUP);

        if (!active) return;
        setResults({
          users: matchedUsers,
          guards: matchedGuards,
          shifts: matchedShifts,
          incidents: matchedIncidents,
        });

        if (
          usersResult.status === 'rejected' &&
          shiftsResult.status === 'rejected' &&
          incidentsResult.status === 'rejected'
        ) {
          setError('Search is unavailable right now.');
        }
      } catch {
        if (active) setError('Search is unavailable right now.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [query]);

  return { results, loading, error, query };
}
