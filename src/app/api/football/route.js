// API Route - This runs on the SERVER, so the API key stays secret
// Users call /api/football?endpoint=fixtures&league=61
// and we forward the request to API-Football with our key

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint) {
    return Response.json({ error: 'Missing endpoint parameter' }, { status: 400 });
  }

  const API_KEY = process.env.API_FOOTBALL_KEY;
  
  if (!API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Build the API-Football URL with all query params except 'endpoint'
  const apiParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'endpoint') {
      apiParams.set(key, value);
    }
  }

  const apiUrl = `https://v3.football.api-sports.io/${endpoint}?${apiParams.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      // Cache for 5 minutes to save API quota (100 req/day on free plan)
      next: { revalidate: 300 },
    });

    const data = await response.json();

    // Log quota info for debugging
    const remaining = response.headers.get('x-ratelimit-requests-remaining');
    if (remaining) {
      console.log(`API-Football quota remaining: ${remaining} | Endpoint: ${endpoint} | Params: ${apiParams.toString()}`);
    }

    // Log if API returned errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-Football errors:', data.errors, '| URL:', apiUrl);
    }

    // Add cache headers so browser also caches
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('API-Football fetch error:', error, '| URL:', apiUrl);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
