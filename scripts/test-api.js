const fetch = require('node-fetch');

async function testPostsAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/posts?all=1', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('API request failed with status:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('API response:', JSON.stringify(data, null, 2));
    
    // Check category structure
    if (Array.isArray(data) && data.length > 0) {
      console.log('\nFirst post category structure:', JSON.stringify(data[0].category, null, 2));
    }
  } catch (error) {
    console.error('Error fetching API:', error);
  }
}

testPostsAPI();