# Changelog

All notable changes to this component library will be documented in this file.

## [1.1.0] - 2025-01-27

### Changed

- **Type Safety Improvements** - Replaced `any` types with proper TypeScript types
  - `codeSplitting.ts` - Improved component type definitions
  - `VirtualTable.tsx` - Better generic type constraints
  - `PaymentHistory.tsx` - Removed unnecessary `@ts-ignore` comments

### Removed

- **Obsolete Code** - Deleted `types-example.ts` file (example file marked for deletion)

### Fixed

- Type safety issues in performance utilities
- Type checking warnings in component files

---

## [1.0.0] - 2025-01-XX

### Added

- **CommandPalette** - Modern command palette with ⌘K shortcut
- **MultiSelect** - Multiple selection with tags and search
- **RichTextEditor** - Rich text editor with toolbar
- **Theme Presets** - 5 presets (default, modern, corporate, vibrant, minimal)
- **Advanced Theme Variables** - Multiple fonts, customizable text colors
- **Complete API Documentation**
- **SaaS Examples** - Dashboard, Settings, Onboarding
- **Functional Storybook Configuration**

### Improved

- **Theme System Migration** - Toast, KanbanBoard, Calendar, CRUDModal
- **ThemeManager** - Improved interface with presets
- **Documentation** - Complete README and guides

### Fixed

- Hardcoded colors replaced with CSS theme variables
- Improved design consistency

---

## [0.9.0] - 2024-12-XX

### Added

- Base components (Button, Input, Card, etc.)
- Data components (Table, DataTable, StatsCard)
- Feedback components (Alert, Modal, Toast)
- Navigation components (Tabs, Accordion, Sidebar)
- Base theme system
- Dark mode support

---

## Notes

- Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- Versioning follows [Semantic Versioning](https://semver.org/)
