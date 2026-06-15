// API Route - Proxy to football-data.org
// Keeps the API token secret server-side
// Client calls: /api/football?path=competitions/FL1/matches?dateFrom=...

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return Response.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  const API_KEY = process.env.FOOTBALL_DATA_KEY;

  if (!API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  const apiUrl = `https://api.football-data.org/v4/${path}`;

  // Path-aware caching (Free + Deep Data plan: 30 calls/min)
  // - Match listings & scores: short cache (75s) so live scores stay fresh
  // - Team squads & static data: long cache (1h) since they rarely change
  const isMatchData = path.includes('/matches');
  const revalidate = isMatchData ? 75 : 3600;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
      next: { revalidate },
    });

    const data = await response.json();

    // Log for debugging
    const remaining = response.headers.get('x-requests-available');
    console.log(`football-data.org | Path: ${path} | Status: ${response.status} | Remaining: ${remaining || '?'}`);

    if (data.errorCode) {
      console.error('football-data.org error:', data.message, '| Path:', path);
    }

    return Response.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
      },
    });
  } catch (error) {
    console.error('football-data.org fetch error:', error, '| Path:', path);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
