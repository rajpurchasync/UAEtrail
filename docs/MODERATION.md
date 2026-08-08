# Content moderation — UAE Trail

Relevant social-content hardening baseline is persisted in `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`.

## User reporting

Users can report from:

| Surface | Target type | API |
|---------|-------------|-----|
| Messages | `user` | `POST /api/v1/reports` |
| Community posts | `post` | same |
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
3. **Hide content** manually (delete post/review via DB or future admin tools)
4. Document outcome in audit log notes (future enhancement)

## Store compliance

- Privacy policy: https://uaetrail.ae/privacy
- Contact: support@uaetrail.ae / privacy@uaetrail.ae
- Account deletion: Profile → Delete account

## Escalation

Illegal content or imminent harm → remove account, preserve audit trail, contact authorities as required by UAE law.
