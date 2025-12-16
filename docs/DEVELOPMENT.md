# Development Guide

This guide covers development workflows, coding standards, and best practices for contributing to wBus.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance](#performance)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher  
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone and Install**

```bash
git clone https://github.com/67D48D5/wBus.git
cd wBus
npm install
```

2. **Configure Environment**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings.

3. **Start Development Server**

```bash
npm run dev
```

### Recommended VS Code Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **TypeScript and JavaScript Language Features** - Built-in
- **Error Lens** - Inline error display

## Development Workflow

### Branch Strategy

```
main
 ├── feature/new-feature
 ├── fix/bug-fix
 └── refactor/improvement
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

### Workflow Steps

1. **Create Feature Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**

Write code following our [coding standards](#coding-standards).

3. **Test Locally**

```bash
npm run lint
npm run build
npm start
```

4. **Commit Changes**

```bash
git add .
git commit -m "feat: add new feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `style:` - Formatting
- `test:` - Tests
- `chore:` - Maintenance

5. **Push and Create PR**

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### TypeScript

#### Type Safety

```typescript
// ✅ Good: Explicit types
function processBus(bus: BusItem): string {
  return bus.vehicleno;
}

// ❌ Bad: Implicit any
function processBus(bus) {
  return bus.vehicleno;
}
```

#### Interface vs Type

```typescript
// ✅ Prefer interface for objects
interface BusProps {
  routeName: string;
  onSelect: (bus: BusItem) => void;
}

// ✅ Use type for unions
type Status = 'loading' | 'success' | 'error';
```

#### Null Safety

```typescript
// ✅ Good: Handle null/undefined
const name = bus?.nodenm ?? 'Unknown';

// ❌ Bad: Assume not null
const name = bus.nodenm;
```

### React

#### Component Structure

```typescript
// ✅ Good: Functional component with types
interface Props {
  routeName: string;
}

export default function BusList({ routeName }: Props) {
  // hooks
  const [state, setState] = useState();
  
  // memoized values
  const value = useMemo(() => calculate(), [deps]);
  
  // callbacks
  const handleClick = useCallback(() => {}, []);
  
  // effects
  useEffect(() => {}, [deps]);
  
  // render
  return <div>...</div>;
}
```

#### Hooks Best Practices

```typescript
// ✅ Good: Stable callbacks
const handleClick = useCallback((id: string) => {
  doSomething(id);
}, [doSomething]);

// ✅ Good: Memoize expensive calculations
const sortedBuses = useMemo(() => {
  return buses.sort(compareFn);
}, [buses, compareFn]);

// ❌ Bad: New function each render
const handleClick = (id: string) => {
  doSomething(id);
};
```

#### Component Memoization

```typescript
// ✅ Good: Memo for expensive components
const BusMarker = React.memo(({ bus }: Props) => {
  return <Marker position={[bus.lat, bus.lng]} />;
});

BusMarker.displayName = 'BusMarker';
```

### File Organization

#### Import Order

```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { MapContainer } from 'react-leaflet';

// 3. Core modules (absolute imports)
import { CacheManager } from '@core/cache/CacheManager';

// 4. Feature modules
import { useBusLocation } from '@bus/hooks/useBusLocation';

// 5. Shared modules
import { formatTime } from '@shared/utils/formatters';

// 6. Types
import type { BusItem } from '@bus/types/data';

// 7. Styles
import './styles.css';
```

#### File Naming

```
✅ PascalCase for components: BusList.tsx
✅ camelCase for utilities: formatters.ts
✅ camelCase for hooks: useBusLocation.ts
```

### CSS / Tailwind

#### Class Organization

```tsx
// ✅ Good: Logical grouping
<div className="
  flex items-center justify-between
  py-2 px-4
  bg-white rounded-lg shadow-sm
  hover:bg-gray-50 transition-colors
">
```

#### Responsive Design

```tsx
// ✅ Good: Mobile-first
<div className="
  w-full 
  md:w-1/2 
  lg:w-1/3
">
```

### Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Use Haversine for accurate geographic distance
const distance = getHaversineDistance(lat1, lng1, lat2, lng2);

// ❌ Bad: Obvious comment
// Get the distance
const distance = getDistance(p1, p2);
```

#### JSDoc for APIs

```typescript
/**
 * Calculates Haversine distance between two geographic points
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude  
 * @param lon2 - Second point longitude
 * @returns Distance in kilometers
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // implementation
}
```

## Project Structure

### Adding New Features

1. **Create feature directory**

```
src/features/my-feature/
├── api/              # API functions
├── components/       # UI components
├── hooks/            # Custom hooks
├── types/            # TypeScript types
└── utils/            # Utilities
```

2. **Follow existing patterns**

Look at `src/features/bus/` for reference.

3. **Export from index (if needed)**

```typescript
// src/features/my-feature/index.ts
export * from './components';
export * from './hooks';
```

### Creating Shared Utilities

```typescript
// src/shared/utils/myUtil.ts
export function myUtilFunction() {
  // implementation
}
```

## Testing

### Unit Tests (To be implemented)

```typescript
// Example structure
describe('formatArrivalTime', () => {
  it('should format time correctly', () => {
    expect(formatArrivalTime(5)).toBe('5분');
  });
  
  it('should show "곧 도착" for <= 3 minutes', () => {
    expect(formatArrivalTime(2)).toBe('곧 도착');
  });
});
```

### Manual Testing Checklist

Before submitting PR:

- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile device
- [ ] Test with slow 3G network
- [ ] Test error scenarios
- [ ] Check browser console for errors
- [ ] Verify no memory leaks

## Debugging

### React DevTools

1. Install React DevTools extension
2. Use Components tab to inspect component tree
3. Use Profiler to find performance issues

### Console Debugging

```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### Performance Monitoring

```typescript
import { performanceMonitor } from '@shared/utils/performanceMonitor';

// Measure operation
await performanceMonitor.measure('fetch-buses', async () => {
  return await getBusLocationData(routeId);
});

// Check stats
const stats = performanceMonitor.getStats('fetch-buses');
console.log('Average time:', stats?.avg);
```

### Cache Debugging

```typescript
const cache = new CacheManager<Data>();

// Check cache state
console.log('Cache size:', cache.size());
console.log('Cache keys:', cache.keys());
console.log('Cache stats:', cache.getStats());
```

## Performance

### Optimization Checklist

- [ ] Use React.memo for expensive components
- [ ] Memoize expensive calculations with useMemo
- [ ] Use useCallback for stable callbacks
- [ ] Implement lazy loading for large components
- [ ] Optimize images (WebP, proper sizes)
- [ ] Code splitting with dynamic imports
- [ ] Minimize re-renders

### Measuring Performance

```typescript
// Wrap expensive operations
const sortedBuses = useMemo(() => {
  performanceMonitor.start('sort-buses');
  const result = buses.sort(compareFn);
  performanceMonitor.end('sort-buses');
  return result;
}, [buses, compareFn]);
```

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true npm run build
```

## Contributing

### Before Submitting PR

1. **Code Quality**
   - Run linter: `npm run lint`
   - Fix formatting issues
   - Remove console.logs

2. **Testing**
   - Test locally
   - Test on different browsers
   - Test on mobile

3. **Documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update CHANGELOG

### PR Guidelines

**Title Format:**
```
type(scope): description

Examples:
feat(bus): add real-time arrival predictions
fix(map): correct marker positioning
docs(api): update API reference
```

**PR Description:**
```markdown
## What
Brief description of changes

## Why
Reason for changes

## How
Implementation details

## Testing
How to test the changes

## Screenshots (if UI changes)
[Add screenshots]
```

### Code Review Process

1. Automated checks must pass
2. At least one approving review required
3. All conversations must be resolved
4. Branch must be up to date with main

## Troubleshooting

### Common Issues

**TypeScript Errors**
```bash
# Clear TypeScript cache
rm -rf .next
npm run dev
```

**Module Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**Build Fails**
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Leaflet Docs](https://leafletjs.com/reference.html)

## Getting Help

- Check existing [Issues](https://github.com/67D48D5/wBus/issues)
- Read [documentation](./README.md)
- Ask in Pull Request comments

---

**Happy coding! 🚀**
