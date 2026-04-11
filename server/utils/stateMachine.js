const ALLOWED_TRANSITIONS = {
  PENDING: ['CLASSIFIED', 'IN_DISPUTE', 'FLAGGED'],
  CLASSIFIED: ['AWAITING_REWARD'],
  IN_DISPUTE: ['RESOLVED_AUTO', 'RESOLVED_MANUAL', 'FLAGGED'],
  RESOLVED_AUTO: ['AWAITING_REWARD'],
  RESOLVED_MANUAL: ['AWAITING_REWARD'],
  AWAITING_REWARD: ['REWARDED'],
  REWARDED: ['REDEEMED'],
  FLAGGED: ['RESOLVED_MANUAL'],
  REDEEMED: [],
};

export function assertValidTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    const err = new Error(`Invalid state transition: ${from} → ${to}`);
    err.status = 422;
    throw err;
  }
}

export function getAllowedTransitions(state) {
  return ALLOWED_TRANSITIONS[state] || [];
}
