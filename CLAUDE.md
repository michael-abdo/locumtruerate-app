# LocumTrueRate.com - AI Navigation Guide

## CRITICAL DEVELOPMENT CONSTRAINT
**🚨 MOBILE-FIRST ARCHITECTURE REQUIREMENT 🚨**

**EVERYTHING MUST BE BUILT WITH MOBILE DEPLOYMENT IN MIND**

All code, components, APIs, and architectural decisions must be designed from the ground up to support:
- **Cross-platform deployment** (Web + iOS + Android)
- **Shared TypeScript codebase** (≥80% code reuse target)
- **TurboRepo monorepo structure** for seamless mobile integration
- **React Native compatibility** for all UI components
- **Universal API design** that works identically on web and mobile

**Implementation Rules:**
1. Use **React components** that can be adapted for React Native
2. Design **responsive layouts** that work on mobile screens first
3. Create **shared business logic** in pure TypeScript packages
4. Avoid **web-only APIs** or browser-specific features
5. Plan **data structures** and **API endpoints** for mobile consumption
6. Use **cross-platform compatible** libraries and patterns

This is not just a web application - it's the foundation for a full cross-platform LocumTrueRate.com ecosystem.

## Project Overview
This project was created using the Triangulated Perspectives Constructor methodology and is being developed as LocumTrueRate.com - a comprehensive locum tenens platform.

## Document Purpose Matrix

| Document | Primary Purpose | Phase/Module | Required Reading Order |
|----------|----------------|--------------|----------------------|
| perspectives/final_features_perspective.md | User requirements and functionality | Requirements | 1st |
| perspectives/abstract_perspective.md | System architecture and design | Architecture | 2nd |
| perspectives/implementation_perspective.md | Technical implementation details | Implementation | 3rd |
| resolution/iteration_1_differences.md | Consensus building iteration | Resolution | 4th |
| resolution/iteration_1_resolutions.md | Consensus building iteration | Resolution | 5th |
| resolution/iteration_2_differences.md | Consensus building iteration | Resolution | 6th |
| resolution/iteration_2_resolutions.md | Consensus building iteration | Resolution | 7th |
| resolution/iteration_3_differences.md | Consensus building iteration | Resolution | 8th |
| resolution/iteration_3_resolutions.md | Consensus building iteration | Resolution | 9th |
| resolution/iteration_4_differences.md | Consensus building iteration | Resolution | 10th |
| resolution/iteration_4_resolutions.md | Consensus building iteration | Resolution | 11th |
| resolution/iteration_5_differences.md | Consensus building iteration | Resolution | 12th |
| resolution/iteration_5_resolutions.md | Consensus building iteration | Resolution | 13th |


## Project Structure
```
jobboard_021932213797238218657/
├── perspectives/          # Core perspective documents
│   ├── final_features_perspective.md
│   ├── abstract_perspective.md
│   └── implementation_perspective.md
├── resolution/           # Consensus building history
│   ├── iteration_1_differences.md
│   ├── iteration_1_resolutions.md
│   ├── iteration_2_differences.md
│   ├── iteration_2_resolutions.md
│   ├── iteration_3_differences.md
│   ├── iteration_3_resolutions.md
│   ├── iteration_4_differences.md
│   ├── iteration_4_resolutions.md
│   ├── iteration_5_differences.md
│   ├── iteration_5_resolutions.md
│   └── consensus_achieved.md
└── CLAUDE.md            # This navigation guide
```

## Task-to-Document Mapping

### Understanding Requirements
**PRIMARY DOCUMENT:** perspectives/final_features_perspective.md
**SECTIONS:** Core Features, Expected Behavior, User Interface

### System Architecture
**PRIMARY DOCUMENT:** perspectives/abstract_perspective.md
**SECTIONS:** Core Infrastructure, Process Flow, Key Components

### Implementation Details
**PRIMARY DOCUMENT:** perspectives/implementation_perspective.md
**SECTIONS:** Technology Stack, Tool Details, Implementation Guidelines

## Critical Rules and Patterns

1. **Priority Hierarchy**: Final Features > Abstract > Implementation
2. **Consensus Required**: All changes must maintain alignment across perspectives
3. **Documentation First**: Update perspectives before implementing changes

## Generated on: 2025-06-15 07:00:52
