import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting notification generation...');

    // Get all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // Calculate date range for upcoming deadlines (next 3 days)
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    let notificationsCreated = 0;

    // For each user, check for upcoming deadlines
    for (const profile of profiles || []) {
      // Get user's classes
      const { data: classMemberships } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', profile.id);

      if (!classMemberships || classMemberships.length === 0) continue;

      const classIds = classMemberships.map(m => m.class_id);

      // Get assignments with deadlines in the next 3 days
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, due_date, class_id')
        .in('class_id', classIds)
        .eq('status', 'approved')
        .gte('due_date', today.toISOString())
        .lte('due_date', threeDaysFromNow.toISOString());

      if (!assignments || assignments.length === 0) continue;

      // For each assignment, check if notification already exists
      for (const assignment of assignments) {
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', profile.id)
          .eq('type', 'deadline')
          .eq('link', `/classes/${assignment.class_id}`)
          .limit(1)
          .single();

        // If notification doesn't exist, create it
        if (!existingNotif) {
          const dueDate = new Date(assignment.due_date);
          const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          const { error: insertError } = await supabase
            .from('notifications')
            .insert({
              user_id: profile.id,
              type: 'deadline',
              title: '⏰ Prazo se aproximando!',
              message: `"${assignment.title}" vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`,
              link: `/classes/${assignment.class_id}`,
            });

          if (!insertError) {
            notificationsCreated++;
            console.log(`Created notification for user ${profile.id}, assignment ${assignment.id}`);
          } else {
            console.error('Error creating notification:', insertError);
          }
        }
      }
    }

    console.log(`Notification generation complete. Created ${notificationsCreated} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsCreated,
        message: `Generated ${notificationsCreated} notifications`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
