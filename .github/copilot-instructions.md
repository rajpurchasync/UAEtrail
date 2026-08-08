Output Directives:
- CODE ONLY. No conversational text, greetings, or explanations.
- PARTIAL OUTPUT: Return only modified functions/lines. Do not rewrite whole files.
- Omit existing imports.
- Zero boilerplate. Zero obvious comments.
- For non-code replies, keep them to 1 short sentence unless the user explicitly asks for detail.
- Do not restate plans, reasoning, or implementation notes unless asked.

Repository Persisted Context:
- Cross-platform auth/session/performance/access baseline is documented in `docs/PERFORMANCE_CROSS_PLATFORM_BUGFIX.md`.
- If behavior touches auth refresh, role switch, team/group access, or social post/reply paths, preserve the invariants in that document.