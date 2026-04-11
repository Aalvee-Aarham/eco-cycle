# EcoCycle — demo accounts

These accounts are created by `npm run seed` in the `server/` folder (see root `README.md`).  
They use the email domain `@demo.ecocycle.app`. Re-running the seed **removes and recreates** all demo users and their submissions/follows.

**Security:** Use only in development or a dedicated demo database. Change passwords before any public deployment.

| Role            | Username        | Email                         | Password          |
|-----------------|-----------------|-------------------------------|-------------------|
| Citizen         | `demo_citizen`  | `citizen@demo.ecocycle.app`   | `DemoCitizen1!`   |
| Moderator       | `demo_moderator`| `moderator@demo.ecocycle.app` | `DemoModerator1!` |
| Administrator   | `demo_admin`    | `admin@demo.ecocycle.app`     | `DemoAdmin1!`     |
| Citizen (private profile demo) | `eco_neighbor` | `neighbor@demo.ecocycle.app` | `DemoNeighbor1!` |

- **Moderator:** dispute queue, audit for submissions under review.  
- **Administrator:** user roles, system config, full audit log.  
- **`eco_neighbor`:** `isPrivate: true` — full profile is visible only to that user and administrators (per platform spec).

After seeding, log in via the client **Login** with the email + password above.
