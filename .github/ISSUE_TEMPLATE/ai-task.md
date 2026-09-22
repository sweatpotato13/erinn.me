---
name: "AI Implementation Task"
about: "A single implementation unit to delegate to an AI agent. Size it to fit one session."
title: "[Task] "
---

### Goal

<!-- Why are we doing this? One paragraph. When judgment calls arise during implementation, this paragraph is the tiebreaker. -->

### Non-goals

<!-- What is explicitly out of scope for this task. Files/modules that must not be touched. Key to preventing scope creep. -->

- 

### Code Anchors

<!-- Exact locations to modify or reference. File path + function name + line number when possible. No "around here" or "somewhere near" language. -->

- Modify: `src/path/to/file.ts:42` `functionName()`
- Reference: `src/path/to/other.ts` `ClassName`
- Add test: `src/path/to/file.spec.ts`

### Interface Contract

<!-- API signatures, types, request/response schemas — in code or JSON, not prose. -->

```typescript
```

### Acceptance Criteria

<!-- Concrete commands the AI can run to self-verify. No "should work well" language. Items that require manual verification (e.g. UI checks) use `- [ ] (manual) ...` and are deferred to human review. -->

- [ ] `pnpm exec jest --runTestsByPath src/path/file.spec.ts` — all pass
- [ ] Existing test suite passes: `pnpm test`
- [ ] (manual) …

### Edge Cases

<!-- Exception handling decisions already made at design time. If left blank, the AI decides arbitrarily. For expensive-to-revert changes (migrations, etc.), include rollback instructions here. -->

- 

### Dependencies

<!-- Predecessor issues, related design documents. For UI full-tier issues, include approved mockup links here — not in Code Anchors (mockups are reference-only, not modification targets). -->

- 
