// Development optimization plugin for Vite
export function devOptimizations() {
  let startTime;
  
  return {
    name: 'dev-optimizations',
    
    // Track build start time
    buildStart() {
      startTime = Date.now();
    },
    
    // Log build completion time
    buildEnd() {
      const duration = Date.now() - startTime;
      console.log(`\n🚀 Build completed in ${duration}ms`);
    },
    
    // Configure development server
    configureServer(server) {
      console.log('Development server configured for optimized performance');
    }
  };
} 