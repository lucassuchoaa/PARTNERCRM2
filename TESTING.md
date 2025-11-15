# Testing & CI/CD Documentation

## Overview

This document provides comprehensive information about the testing infrastructure and CI/CD pipeline implemented for the Partners Platform CRM.

## Test Coverage

### Current Coverage: 84.31% ✅

| Metric | Coverage | Target |
|--------|----------|--------|
| Statements | 84.61% | 60% |
| Branches | 65.78% | 60% |
| Functions | 100% | 60% |
| Lines | 84.31% | 60% |

**Status**: Exceeds all minimum requirements

## Unit Tests (Vitest)

### Configuration

- Framework: Vitest 4.0.9
- Environment: jsdom
- Coverage: v8 provider
- UI: @vitest/ui

### Test Files

```
src/tests/
├── setup.ts                      # Global test setup
├── config/
│   └── api.test.ts              # API config tests (3 tests)
└── services/
    ├── auth.test.ts             # Auth service tests (9 tests)
    └── emailService.test.ts     # Email service tests (10 tests)
```

### Running Unit Tests

```bash
# Watch mode
npm test

# Run once
npm run test:run

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Test Results

- **Total Tests**: 22
- **Status**: All passing
- **Execution Time**: ~750ms
- **Files**: 3/3 passing

## E2E Tests (Playwright)

### Configuration

- Framework: Playwright 1.56.1
- Browser: Chromium
- Parallel: Enabled
- CI Mode: Configured

### Test Files

```
e2e/
├── login.spec.ts        # Login flow tests (6 tests)
├── dashboard.spec.ts    # Dashboard tests (5 tests)
└── health.spec.ts       # Health check tests (5 tests)
```

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui

# Debug mode
npx playwright test --debug
```

### E2E Test Coverage

- Login flow with validation
- Dashboard loading and navigation
- Health checks
- Performance metrics
- Responsiveness
- Basic accessibility

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI Pipeline (.github/workflows/ci.yml)

**Triggers**: Push/PR on main and develop branches

**Jobs**:

1. **Lint** (ESLint)
   - Duration: ~30s
   - Node: 20.x

2. **TypeCheck** (TypeScript)
   - Duration: ~20s
   - Node: 20.x

3. **Test** (Unit Tests)
   - Duration: ~1min
   - Matrix: Node 18.x, 20.x
   - Coverage upload to Codecov

4. **Build** (Production)
   - Duration: ~1min
   - Artifacts: dist/

5. **E2E** (Playwright)
   - Duration: ~2min
   - Depends on: build
   - Report on failure

6. **Quality Gate**
   - Validates all previous jobs
   - Fails if any job fails

**Total Duration**: ~4-5 minutes

#### Deploy Pipeline (.github/workflows/deploy.yml)

**Trigger**: Push to main branch

**Steps**:
1. Checkout and setup
2. Lint + TypeCheck
3. Unit tests
4. Production build
5. Deploy to Vercel
6. Health check (10s delay)
7. Automated rollback on failure
8. Post-deployment validation

**Required Secrets**:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `CODECOV_TOKEN` (optional)

## Pre-commit Hooks (Husky)

### Pre-commit

Runs on every commit:

```bash
# Lint staged files
npx lint-staged
```

Configuration:
```json
{
  "*.{ts,tsx}": ["eslint --fix"]
}
```

### Pre-push

Runs before every push:

```bash
# Run all unit tests
npm run test:run
```

Prevents push if tests fail.

## Quality Gates

### Automated Checks

1. **Syntax Validation**
   - ESLint rules
   - TypeScript compiler

2. **Type Safety**
   - Strict mode enabled
   - No implicit any

3. **Test Coverage**
   - Minimum 60% (current: 84%)
   - All critical services tested

4. **Build Validation**
   - Production build succeeds
   - Bundle size within limits

5. **E2E Tests**
   - Critical user flows pass
   - Performance thresholds met

## Best Practices

### Writing Tests

1. **Unit Tests**
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Mock external dependencies
   - Test edge cases and errors

2. **E2E Tests**
   - Test real user workflows
   - Use data-testid for stability
   - Clean up after each test
   - Handle async operations properly

### Running Tests Locally

Before committing:
```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run unit tests
npm run test:run

# Run build
npm run build
```

Before pushing:
```bash
# Run all tests
npm run test:run

# Run E2E tests (optional but recommended)
npm run test:e2e
```

## Coverage Reports

### Viewing Coverage

After running tests with coverage:

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  lines: 60,
  functions: 60,
  branches: 60,
  statements: 60,
}
```

## Troubleshooting

### Common Issues

1. **Tests failing locally but passing in CI**
   - Clear node_modules and reinstall
   - Check Node version matches CI

2. **E2E tests timing out**
   - Increase timeout in playwright.config.ts
   - Check dev server is running

3. **Coverage not generating**
   - Install @vitest/coverage-v8
   - Check vitest.config.ts setup

4. **Pre-commit hooks not running**
   - Run `npm run prepare`
   - Check .husky folder permissions

### Debug Commands

```bash
# Debug Vitest
npm test -- --reporter=verbose

# Debug Playwright
npx playwright test --debug

# Check Husky hooks
npx husky install
```

## Future Improvements

### Short-term

- [ ] Add visual regression testing
- [ ] Increase branch coverage to 80%
- [ ] Add integration tests for API
- [ ] Component testing with Vitest

### Long-term

- [ ] Performance benchmarking
- [ ] Mutation testing
- [ ] Security scanning in CI
- [ ] Automated dependency updates
- [ ] Canary deployments

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Husky Documentation](https://typicode.github.io/husky/)

## Support

For questions or issues:
- Check existing tests for examples
- Review this documentation
- Open a GitHub issue
- Contact: lucasuchoa@hotmail.com

---

Last updated: 2025-11-15
