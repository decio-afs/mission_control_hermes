#!/usr/bin/env node
/**
 * Mission Control Enhancement Runner
 * 
 * Usage:
 *   node run-enhancement.js [focus-area]
 * 
 * Examples:
 *   node run-enhancement.js              # Auto-detect based on time
 *   node run-enhancement.js code-quality # Force specific focus
 *   node run-enhancement.js performance
 *   node run-enhancement.js ui-ux
 *   node run-enhancement.js testing
 *   node run-enhancement.js documentation
 */

const fs = require('fs');
const { execSync } = require('child_process');

const FOCUS_AREAS = {
  0: { name: 'Code Quality', file: 'code-quality.md' },
  1: { name: 'Performance', file: 'performance.md' },
  2: { name: 'UI/UX', file: 'ui-ux.md' },
  3: { name: 'Testing', file: 'testing.md' },
  4: { name: 'Documentation', file: 'documentation.md' }
};

function getCurrentFocus() {
  const hour = new Date().getHours();
  return FOCUS_AREAS[Math.floor(hour / 3) % 5];
}

function printBanner(focus) {
  console.log('\n' + '='.repeat(60));
  console.log('  MISSION CONTROL ENHANCEMENT CYCLE');
  console.log('='.repeat(60));
  console.log(`  Time: ${new Date().toLocaleString()}`);
  console.log(`  Focus: ${focus.name}`);
  console.log('='.repeat(60) + '\n');
}

function printInstructions(focus) {
  const instructions = {
    'Code Quality': `
┌─ TASKS ──────────────────────────────────────────────────┐
│ 1. Analyze src/pages/GhostNetwork.tsx                     │
│    → Split if >300 lines                                  │
│ 2. Run: npm run lint                                      │
│    → Fix all warnings                                     │
│ 3. Run: npx tsc --noEmit                                  │
│    → Fix type errors                                      │
│ 4. Remove unused imports/code                             │
│ 5. Improve type safety                                    │
└───────────────────────────────────────────────────────────┘`,
    
    'Performance': `
┌─ TASKS ──────────────────────────────────────────────────┐
│ 1. Check React re-renders                                 │
│    → Add useMemo/useCallback where needed                │
│ 2. Optimize SVG animations                                │
│    → Use CSS transforms instead of JS                    │
│ 3. Check bundle size                                      │
│    → Run: npm run build                                   │
│ 4. Review API calls                                       │
│    → Add caching if needed                               │
│ 5. Check memory leaks in useEffect                        │
└───────────────────────────────────────────────────────────┘`,
    
    'UI/UX': `
┌─ TASKS ──────────────────────────────────────────────────┐
│ 1. Add cyberpunk effects                                  │
│    → CRT scanlines, glow effects                         │
│ 2. Test responsive design                                 │
│    → Check mobile layout                                 │
│ 3. Add micro-interactions                                 │
│    → Hover states, transitions                           │
│ 4. Verify color consistency                               │
│    → Check design system compliance                      │
│ 5. Add loading states                                     │
└───────────────────────────────────────────────────────────┘`,
    
    'Testing': `
┌─ TASKS ──────────────────────────────────────────────────┐
│ 1. Add unit tests for src/lib/                            │
│ 2. Add component tests                                    │
│ 3. Check coverage: npm run test -- --coverage             │
│ 4. Add integration tests for stores                       │
│ 5. Test GhostNetwork animations                           │
└───────────────────────────────────────────────────────────┘`,
    
    'Documentation': `
┌─ TASKS ──────────────────────────────────────────────────┐
│ 1. Update README.md                                       │
│ 2. Add JSDoc comments to functions                        │
│ 3. Update AGENTS.md                                       │
│ 4. Document new APIs                                      │
│ 5. Add inline comments for complex logic                  │
└───────────────────────────────────────────────────────────┘`
  };
  
  console.log(instructions[focus.name]);
}

function getKimiCommand(focus) {
  return `kimi -p "Enhance Mission Control ${focus.name} based on ENHANCEMENT_GOALS.md. Focus on: ${getSpecificTasks(focus.name)}"`;
}

function getSpecificTasks(focusName) {
  const tasks = {
    'Code Quality': 'refactoring large components, fixing lint errors, improving TypeScript types, removing dead code',
    'Performance': 'optimizing React renders, reducing bundle size, improving animation performance',
    'UI/UX': 'adding cyberpunk visual effects, responsive design improvements, micro-interactions',
    'Testing': 'adding unit tests, integration tests, improving test coverage',
    'Documentation': 'updating README, adding JSDoc comments, documenting APIs'
  };
  return tasks[focusName];
}

function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let focus;
  
  if (args.length > 0) {
    // Map argument to focus area
    const arg = args[0].toLowerCase();
    const found = Object.values(FOCUS_AREAS).find(f => 
      f.name.toLowerCase().replace(' ', '-') === arg ||
      f.name.toLowerCase().replace('/', '') === arg
    );
    focus = found || getCurrentFocus();
  } else {
    focus = getCurrentFocus();
  }
  
  printBanner(focus);
  printInstructions(focus);
  
  console.log('\n' + '='.repeat(60));
  console.log('  RUN THIS COMMAND TO START ENHANCEMENT:');
  console.log('='.repeat(60));
  console.log('\n  ' + getKimiCommand(focus));
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Optionally, run it automatically if --auto flag is passed
  if (args.includes('--auto')) {
    console.log('Running enhancement automatically...\n');
    try {
      execSync(getKimiCommand(focus), { stdio: 'inherit' });
    } catch (e) {
      console.error('Failed to run enhancement:', e.message);
      process.exit(1);
    }
  }
}

main();
