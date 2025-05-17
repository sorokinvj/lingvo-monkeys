import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/schema/schema';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/app/(noFooter)/admin/helpers';
import { LANDING_VIDEO_UUID } from '@/config/constants';

// Mark this route as dynamic to prevent static generation errors
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from(Tables.USER)
    .select('email')
    .eq('id', user.id)
    .single();

  // Используем ту же функцию проверки что и на странице
  const isAdmin = isAdminEmail(userData?.email);

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Count total video play interactions for landing page video
    const { count: playCount } = await supabase
      .from('PlayerInteractionEvent')
      .select('*', { count: 'exact', head: true })
      .eq('fileId', LANDING_VIDEO_UUID)
      .eq('actionType', 'play');

    // Count unique users who played the video
    const { data: uniquePlays } = await supabase
      .from('PlayerInteractionEvent')
      .select('userId')
      .eq('fileId', LANDING_VIDEO_UUID)
      .eq('actionType', 'play');

    const uniqueUserPlays = new Set(uniquePlays?.map((item) => item.userId))
      .size;

    // Count video completion events
    const { count: completionCount } = await supabase
      .from('PlayerInteractionEvent')
      .select('*', { count: 'exact', head: true })
      .eq('fileId', LANDING_VIDEO_UUID)
      .eq('actionType', 'playback_complete');

    // Count unique users who completed the video
    const { data: uniqueCompletions } = await supabase
      .from('PlayerInteractionEvent')
      .select('userId')
      .eq('fileId', LANDING_VIDEO_UUID)
      .eq('actionType', 'playback_complete');

    const uniqueUserCompletions = new Set(
      uniqueCompletions?.map((item) => item.userId)
    ).size;

    // Calculate completion rate
    const completionRate =
      uniqueUserPlays > 0
        ? Math.round((uniqueUserCompletions / uniqueUserPlays) * 100)
        : 0;

    return NextResponse.json({
      totalPlays: playCount || 0,
      uniquePlays: uniqueUserPlays || 0,
      totalCompletions: completionCount || 0,
      uniqueCompletions: uniqueUserCompletions || 0,
      completionRate: `${completionRate}%`,
    });
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video analytics' },
      { status: 500 }
    );
  }
}
