# Project Brief: cconsent

## Overview
cconsent is a lightweight, GDPR-compliant cookie consent dialog library built with vanilla JavaScript and TypeScript. It provides a complete solution for managing cookie consent on websites with support for multiple frameworks.

## Core Requirements
1. **GDPR Compliance**: Must support opt-in consent model with granular category control
2. **5-Category Model**: Necessary, Functional, Preferences, Analytics, Marketing
3. **Google Consent Mode v2**: Native integration with Google Analytics 4 and Google Ads
4. **Geolocation Support**: Region-based consent modes (GDPR, CCPA, LGPD)
5. **Script Blocking**: Automatic blocking of scripts/iframes until consent is given
6. **Framework Adapters**: React, Vue, and Svelte support
7. **TypeScript Support**: Full type definitions

## Goals
- Provide a drop-in cookie consent solution that "just works"
- Zero external dependencies for the core library
- < 15KB bundle size
- WCAG 2.1 AA accessible
- Mobile-first responsive design

## Target Users
- Web developers needing GDPR compliance
- Marketing teams using Google Analytics/Ads
- Sites serving EU, California, and Brazilian users
