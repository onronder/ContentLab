require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoints to simulate traffic for
const endpoints = ['api/analyze', 'api/reports', 'api/jobs', 'api/data'];
// Regions to simulate traffic in
const regions = ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1'];

/**
 * Generate a random number between min and max (inclusive)
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulate traffic for a specific endpoint and region
 */
async function simulateTrafficForEndpoint(endpoint, region, multiplier = 1) {
  try {
    // Generate random metrics
    const requests = getRandomInt(50, 500) * multiplier;
    const errors = Math.floor(requests * getRandomInt(1, 5) / 100); // 1-5% error rate
    const avgLatency = getRandomInt(50, 500); // 50-500ms
    const p95Latency = avgLatency * getRandomInt(15, 20) / 10; // 1.5-2x avg latency
    const maxLatency = p95Latency * getRandomInt(15, 30) / 10; // 1.5-3x p95 latency

    // Current time
    const now = new Date();

    // Record the metrics using the RPC function
    const { data, error } = await supabase.rpc('record_traffic_metrics', {
      p_time: now.toISOString(),
      p_endpoint: endpoint,
      p_region: region,
      p_requests: requests,
      p_errors: errors,
      p_avg_latency_ms: avgLatency,
      p_p95_latency_ms: p95Latency,
      p_max_latency_ms: maxLatency
    });

    if (error) {
      console.error(`Error recording traffic for ${endpoint} in ${region}:`, error);
      return false;
    }

    console.log(`Recorded traffic for ${endpoint} in ${region}: ${requests} requests`);
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

/**
 * Simulate traffic for all endpoints and regions
 */
async function simulateTraffic() {
  // Apply time-based multiplier (simulate busier times during business hours)
  const hour = new Date().getHours();
  const isBusinessHour = hour >= 9 && hour <= 17;
  const isWeekend = [0, 6].includes(new Date().getDay()); // 0 = Sunday, 6 = Saturday
  
  let multiplier = 1;
  if (isBusinessHour && !isWeekend) {
    multiplier = 1.5; // Busier during business hours on weekdays
  } else if (isWeekend) {
    multiplier = 0.6; // Less busy on weekends
  } else if (hour >= 18 && hour <= 22) {
    multiplier = 1.3; // Slightly busier in evening
  } else if (hour >= 0 && hour <= 5) {
    multiplier = 0.3; // Very quiet overnight
  }

  console.log(`Simulating traffic with multiplier: ${multiplier}`);

  let successCount = 0;
  
  // Simulate traffic for each endpoint and region
  for (const endpoint of endpoints) {
    for (const region of regions) {
      // Randomly skip some endpoint/region combinations
      if (Math.random() < 0.3) continue;
      
      const success = await simulateTrafficForEndpoint(endpoint, region, multiplier);
      if (success) successCount++;
    }
  }

  console.log(`Simulation complete. Successfully recorded ${successCount} traffic entries.`);

  // Generate traffic predictions based on the new data
  console.log('Generating traffic predictions...');
  const { data, error } = await supabase.rpc('generate_traffic_predictions');
  
  if (error) {
    console.error('Error generating traffic predictions:', error);
  } else {
    console.log(`Generated ${data} traffic predictions.`);
  }
}

// Run the simulation
simulateTraffic(); 