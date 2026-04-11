/** Normalize paginated / wrapped list responses from the API. */
export function unwrapList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.submissions)) return res.submissions;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.users)) return res.users;
  if (Array.isArray(res.entries)) return res.entries;
  if (Array.isArray(res.leaderboard)) return res.leaderboard;
  return [];
}

export function unwrapTotal(res) {
  if (res == null) return 0;
  if (typeof res.total === 'number') return res.total;
  if (typeof res.count === 'number') return res.count;
  if (Array.isArray(res)) return res.length;
  return unwrapList(res).length;
}

export function submissionId(s) {
  return s?._id ?? s?.id ?? '';
}

export function userPoints(u) {
  return u?.totalPoints ?? u?.points ?? 0;
}
