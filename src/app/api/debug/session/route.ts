import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    
    return NextResponse.json({
      hasSessionToken: !!sessionToken,
      sessionToken: sessionToken ? sessionToken.substring(0, 10) + '...' : null,
      allCookies: Object.fromEntries(
        Array.from(cookieStore.getAll()).map(cookie => [cookie.name, cookie.value.substring(0, 10) + '...'])
      )
    });
  } catch (error) {
    return NextResponse.json({ error: 'Debug error', details: error }, { status: 500 });
  }
}