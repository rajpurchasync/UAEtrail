# Content moderation — UAE Trail

Social content is sanitized server-side; see `apps/api` content moderation and [`COMMUNICATION.md`](./COMMUNICATION.md).

## User reporting

Users can report from:

| Surface | Target type | API |
|---------|-------------|-----|
| Messages | `user` | `POST /api/safety/reports` |
| Reviews | `review` | same |

Reports are stored as **audit logs** with `action: content_report`.

## Admin review

1. Sign in as platform admin
2. **Admin → Audit log**
3. Filter **Action:** `content_report`
4. Review `entityType`, `entityId`, and metadata (`reason`, `details`)

## Recommended workflow

1. **Triage** within 24–48 hours for harassment/scam reports
2. **Suspend user** via Admin → Users if repeat offender
3. **Hide content** manually (delete review via DB or future admin tools; legacy `post` targets are historical only)
4. Document outcome in audit log notes (future enhancement)

## Store compliance

- Privacy policy: https://uaetrail.com/privacy
- Contact: support@uaetrail.com / privacy@uaetrail.com
- Account deletion: Profile → Delete account

## Escalation

Illegal content or imminent harm → remove account, preserve audit trail, contact authorities as required by UAE law.
