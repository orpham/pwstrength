# Changelog

All notable changes to this project will be documented in this file. The format is based
on [Keep a Changelog](https://keepachangelog.com).

## [1.0.3] - 2026-06-11

Fix several typos.

### Added

- Code of conduct

## [1.0.2] - 2026-06-02

Initial automated npm release via GitHub Actions Trusted Publisher.

## [1.0.1] - 2026-06-01

Initial manual npm release.

## [1.0.0] - 2026-06-01

Complete rewrite of [pwstrength-bootstrap](https://github.com/ablanco/jquery.pwstrength.bootstrap) by Alejandro Blanco.

### Added

- TypeScript rewrite with full type declarations
- Class-based API: `new PasswordStrength(input, options)`
- `IPasswordStrength` interface for typed consumers
- `createI18n()` helper for plain-object translations
- `builtinRules` export for direct access to rule functions
- Bootstrap 5 native support (Popover, progress bar, status)
- 13 European locales: `cs`, `de`, `el`, `en`, `es`, `fr`, `it`, `nl`, `no`, `pl`, `pt`, `sk`, `tr`

### Changed

- Removed jQuery dependency — vanilla JS only
- Removed Bootstrap 2 / 3 / 4 compatibility code
- Removed `bower.json` and Grunt build in favor of Vite + Vitest
- Replaced i18next integration with a simple `i18n.t` callback
- `events` default changed from `keyup` to `input`

### Removed

- jQuery plugin interface (`$.fn.pwstrength`)
