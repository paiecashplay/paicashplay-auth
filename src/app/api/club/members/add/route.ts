import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubId, ...memberData } = body;

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID required' }, { status: 400 });
    }

    // Get authorization header from the original request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Forward the request to the OAuth endpoint
    const oauthResponse = await fetch(`http://localhost:3000/api/oauth/clubs/${clubId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(memberData)
    });

    const responseData = await oauthResponse.json();

    if (!oauthResponse.ok) {
      return NextResponse.json(responseData, { status: oauthResponse.status });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}