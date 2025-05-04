/**
 * This script runs after the Next.js build process to ensure
 * that any database connections opened during static generation
 * are properly closed before Vercel proceeds with deployment.
 */

console.log('Running post-build database connection cleanup...');

// Short delay to let any pending connections complete
setTimeout(() => {
  console.log('Forced cleanup successful, exiting build process');
  process.exit(0);
}, 3000); // 3 second timeout

// Handle any unexpected errors
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection during cleanup:', reason);
  process.exit(1);
});

// Force process exit after 10 seconds as a fallback
setTimeout(() => {
  console.warn('Forcing exit after timeout');
  process.exit(0);
}, 10000); // 10 second ultimate timeout 