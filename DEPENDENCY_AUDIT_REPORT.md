# Dependency Audit Report
**Project:** visione-ai
**Date:** 2025-12-18
**Auditor:** Claude Code

---

## Executive Summary

The project has a lean dependency footprint (97MB node_modules, 136 packages) with **2 moderate security vulnerabilities** and several outdated packages. Key issues include missing lock file, non-functional lint script, and major version updates available for core dependencies.

---

## 🚨 Critical Issues

### 1. Missing package-lock.json
**Severity:** High
**Impact:** Build reproducibility, dependency drift, security

**Problem:** No lock file exists, meaning:
- Different developers may install different versions
- CI/CD builds are non-deterministic
- Security audits cannot verify exact versions

**Recommendation:**
```bash
# Generate and commit lock file
npm install
git add package-lock.json
git commit -m "Add package-lock.json for dependency reproducibility"
```

### 2. Security Vulnerabilities (2 Moderate)
**CVE:** GHSA-67mh-4wv8-2f99
**Package:** esbuild <=0.24.2 (via vite 5.4.21)
**Severity:** Moderate (CVSS 5.3)
**Description:** esbuild enables any website to send requests to dev server

**Current:** vite@5.4.21 with vulnerable esbuild
**Fix Available:** vite@7.3.0 (breaking change)

**Recommendation:** See upgrade plan in "Recommended Actions" section below

### 3. Broken Lint Script
**Severity:** Medium
**Problem:** `package.json` defines `"lint": "eslint ."` but ESLint is not installed

**Recommendation:**
```bash
npm install -D eslint @eslint/js @types/eslint eslint-plugin-react-hooks
```

---

## 📦 Outdated Dependencies Analysis

| Package | Current | Latest | Type | Breaking |
|---------|---------|--------|------|----------|
| **vite** | 5.4.21 | 7.3.0 | Major | ✅ Yes |
| **react** | 18.3.1 | 19.2.3 | Major | ✅ Yes |
| **react-dom** | 18.3.1 | 19.2.3 | Major | ✅ Yes |
| **tailwindcss** | 3.4.19 | 4.1.18 | Major | ✅ Yes |
| **@vitejs/plugin-react** | 4.7.0 | 5.1.2 | Major | ✅ Yes |
| **lucide-react** | 0.454.0 | 0.562.0 | Minor | ⚠️ Likely safe |
| **@types/react** | 18.3.27 | 19.2.7 | Major | ℹ️ Follows React |
| **@types/react-dom** | 18.3.7 | 19.2.3 | Major | ℹ️ Follows React |

### Update Complexity Assessment

**High Risk (Breaking Changes):**
- **Vite 5 → 7:** Major API changes, new features, plugin ecosystem updates
- **React 18 → 19:** New compiler, hooks changes, concurrent rendering updates
- **TailwindCSS 3 → 4:** Complete rewrite, new engine, config changes

**Low Risk:**
- **lucide-react:** Icon library, patch updates are typically safe
- **@google/generative-ai:** Already on latest (0.24.1)

---

## 🎯 Dependency Necessity Analysis

All dependencies are **justified and necessary**:

### Production Dependencies ✅
- `react` + `react-dom`: Core framework
- `@google/generative-ai`: AI integration (core feature)
- `lucide-react`: Icon library (used extensively in UI)

### Development Dependencies ✅
- `typescript`: Type safety
- `vite`: Build tool + dev server
- `@vitejs/plugin-react`: React support for Vite
- `tailwindcss` + `postcss` + `autoprefixer`: Styling framework
- `@types/react` + `@types/react-dom`: TypeScript definitions

**No bloat detected.** All packages serve active purposes.

---

## 📊 Bundle Size Analysis

```
Total node_modules size: 97MB
Total packages: 136 (including transitive dependencies)
Deduped packages: 74 (good - npm is optimizing duplicates)
```

**Assessment:** Size is **reasonable** for a React + TypeScript + Vite + TailwindCSS stack.

---

## ✅ Recommended Actions

### Phase 1: Immediate (Security & Stability)

#### 1.1 Add Lock File
```bash
npm install
git add package-lock.json
git commit -m "chore: add package-lock.json for reproducibility"
```

#### 1.2 Fix ESLint Configuration
```bash
# Install ESLint and recommended plugins
npm install -D eslint@^9 @eslint/js @types/eslint eslint-plugin-react-hooks eslint-plugin-react-refresh

# Create eslint.config.js
cat > eslint.config.js << 'EOF'
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
EOF

# Verify it works
npm run lint
```

#### 1.3 Patch Outdated Safe Dependencies
```bash
# Update lucide-react (safe minor update)
npm update lucide-react

# Update TypeScript tooling (safe patch updates)
npm update typescript @types/react @types/react-dom autoprefixer postcss
```

### Phase 2: Security Fix (Medium Priority)

**Option A: Conservative (Vite 6 - if available)**
```bash
# Check if Vite 6 is available (less breaking changes than v7)
npm info vite versions

# If v6 exists:
npm install -D vite@^6
```

**Option B: Full Upgrade (Vite 7 - recommended for long-term)**
```bash
# Upgrade to Vite 7 (fixes security issue)
npm install -D vite@^7 @vitejs/plugin-react@^5

# Test thoroughly
npm run dev
npm run build
npm run preview
```

**Testing Checklist after Vite upgrade:**
- [ ] Dev server starts without errors
- [ ] Hot module replacement works
- [ ] Build completes successfully
- [ ] Preview works
- [ ] Google Generative AI integration still works
- [ ] Image uploads function correctly

### Phase 3: Major Upgrades (Optional - Plan for Future)

**React 19 Upgrade** (defer until ecosystem stabilizes)
```bash
# React 19 is very new (released recently)
# Recommendation: Wait 3-6 months for ecosystem maturity
# Many libraries are still catching up
```

**TailwindCSS 4 Upgrade** (defer - major rewrite)
```bash
# TailwindCSS v4 is a complete rewrite
# Requires significant config changes
# Recommendation: Evaluate in Q2 2026
```

---

## 🔍 Additional Recommendations

### 1. Add Missing Scripts
Update `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "audit": "npm audit"
  }
}
```

### 2. Add .npmrc for Consistency
Create `.npmrc`:
```
save-exact=false
engine-strict=true
```

### 3. Add engines Field
Update `package.json`:
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 4. Setup Dependabot
Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: "development"
      production-dependencies:
        dependency-type: "production"
```

---

## 🎯 Priority Summary

**Must Do (This Week):**
1. ✅ Add package-lock.json
2. ✅ Fix ESLint installation
3. ✅ Update safe dependencies (lucide-react, TypeScript)

**Should Do (This Month):**
4. ⚠️ Upgrade Vite to v7 (security fix)
5. 📝 Add missing npm scripts
6. 📝 Setup Dependabot

**Consider Later (Q1-Q2 2026):**
7. 🤔 React 19 (wait for ecosystem)
8. 🤔 TailwindCSS 4 (major rewrite)

---

## Conclusion

The project has a **healthy, lean dependency tree** with no bloat. Main concerns are:
1. Missing lock file (critical for reproducibility)
2. Security vulnerability in Vite/esbuild (moderate)
3. Broken lint script
4. Several major version updates available (breaking changes)

**Overall Grade: B+**
Clean codebase with minor technical debt. Addressing the lock file and security issues would raise this to an A.
