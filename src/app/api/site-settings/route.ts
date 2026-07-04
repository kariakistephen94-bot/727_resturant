import { NextResponse } from 'next/server';
import { getSiteSettingsRow, updateSiteSettingsRow } from '@/lib/server/dummy-db';
import { getFakeAdminUser } from '@/lib/server/fake-auth';
import { defaultSiteSettings, mapSiteSettingsRow, mapSiteSettingsToRow, type SiteSettings } from '@/lib/site-settings';

export async function GET() {
  return NextResponse.json(mapSiteSettingsRow(getSiteSettingsRow()));
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SiteSettings>;
  const user = await getFakeAdminUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = mapSiteSettingsToRow({
    ...defaultSiteSettings,
    ...body,
  } as SiteSettings);

  const saved = updateSiteSettingsRow(row);
  return NextResponse.json(mapSiteSettingsRow(saved));
}
