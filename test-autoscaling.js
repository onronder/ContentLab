require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAutoScaling() {
  try {
    // Call the auto-scaling function
    const { data, error } = await supabase.functions.invoke('auto-scaling', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {}
    });

    if (error) {
      console.error('Error calling auto-scaling function:', error);
      return;
    }

    console.log('Auto-scaling results:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testAutoScaling(); 