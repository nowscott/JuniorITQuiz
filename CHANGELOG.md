# Changelog

All notable changes to this project will be documented in this file.

## [1.1.15] - 2026-06-18

### Fixed

- Fixed an exam keyboard handling issue where pressing Enter could trigger both answer confirmation and question navigation, causing questions to be skipped.
- Added validation for shared exam seeds to reject invalid question counts, time limits, or unsafe numeric seed values before starting an exam.
- Added an empty-question-bank guard before starting randomized exams.
- Hardened local question data writes by validating question-bank structure before overwriting `data/questions.json`.
- Restricted question-bank write access to local development hosts.

### Security

- Upgraded Next.js and eslint-config-next to `16.2.9`.
- Overrode transitive PostCSS resolution to `8.5.10` to clear known audit findings.

### Documentation

- Aligned README Node.js requirements with the project engine setting: Node.js `24.x`.
