// API Route - This runs on the SERVER, so the API key stays secret
// Users call /api/football?endpoint=fixtures&league=61&season=2024
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
      // Cache for 60 seconds to save API quota
      next: { revalidate: 60 },
    });

    const data = await response.json();

    // Add cache headers so browser also caches
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('API-Football error:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
