#!/usr/bin/env tsx

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Tables } from '@/schema/schema';

// Default emails to delete if none are provided via command line
const DEFAULT_EMAILS_TO_DELETE = [
  'xeniamchedlidze@gmail.com',
  'sorokinvj+new_acc-2@gmail.com',
  'sorokinvj+new_acc@gmail.com',
  'vladislav+34@proxylink.co',
  'vladislav@proxylink.co',
  'kseniamchedlidze@gmail.com',
];

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function deleteUsersWithData(userEmails = DEFAULT_EMAILS_TO_DELETE) {
  console.log(`Starting deletion process for ${userEmails.length} users...`);

  // Initialize Supabase client with service role key for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  for (const email of userEmails) {
    try {
      console.log(`Processing user: ${email}`);

      // 1. First find the user by email
      const { data: userData, error: userError } = await supabase
        .from(Tables.USER)
        .select('id')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error(`Error finding user ${email} in User table:`, userError);
        continue;
      }

      if (!userData) {
        console.warn(`User ${email} not found in database. Checking auth...`);

        // Try to find user in auth.users
        const { data: authUserData, error: authUserError } =
          await supabase.auth.admin.listUsers();

        if (authUserError) {
          console.error('Error listing auth users:', authUserError);
          continue;
        }

        const authUser = authUserData.users.find(
          (user) => user.email === email
        );
        if (!authUser) {
          console.warn(`User ${email} not found in auth.users. Skipping.`);
          continue;
        }

        // Delete from auth only
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
          authUser.id
        );

        if (deleteAuthError) {
          console.error(`Error deleting auth user ${email}:`, deleteAuthError);
        } else {
          console.log(`Successfully deleted auth user ${email}`);
        }

        continue;
      }

      const userId = userData.id;
      console.log(`Found user ID: ${userId}`);

      // 2. Delete related data: FileUploadEvent
      try {
        const { error: fileUploadEventError } = await supabase
          .from(Tables.FILE_UPLOAD_EVENT)
          .delete()
          .eq('userId', userId);

        if (fileUploadEventError && fileUploadEventError.code !== '42P01') {
          console.error(
            `Error deleting file upload events for user ${email}:`,
            fileUploadEventError
          );
        }
      } catch (error) {
        // Ignore table doesn't exist errors
      }

      // 3. Delete related data: FileListeningEvent
      try {
        const { error: fileListeningEventError } = await supabase
          .from(Tables.FILE_LISTENING_EVENT)
          .delete()
          .eq('userId', userId);

        if (
          fileListeningEventError &&
          fileListeningEventError.code !== '42P01'
        ) {
          console.error(
            `Error deleting file listening events for user ${email}:`,
            fileListeningEventError
          );
        }
      } catch (error) {
        // Ignore table doesn't exist errors
      }

      // 4. Delete related data: PageViewEvent
      try {
        const { error: pageViewEventError } = await supabase
          .from(Tables.PAGE_VIEW_EVENT)
          .delete()
          .eq('userId', userId);

        if (pageViewEventError && pageViewEventError.code !== '42P01') {
          console.error(
            `Error deleting page view events for user ${email}:`,
            pageViewEventError
          );
        }
      } catch (error) {
        // Ignore table doesn't exist errors
      }

      // 5. Delete related data: PlayerInteractionEvent
      try {
        const { error: playerEventError } = await supabase
          .from(Tables.PLAYER_EVENT)
          .delete()
          .eq('userId', userId);

        if (playerEventError && playerEventError.code !== '42P01') {
          console.error(
            `Error deleting player events for user ${email}:`,
            playerEventError
          );
        }
      } catch (error) {
        // Ignore table doesn't exist errors
      }

      // 6. Delete related data: SettingsChangeEvent
      try {
        const { error: settingsEventError } = await supabase
          .from(Tables.SETTINGS_EVENT)
          .delete()
          .eq('userId', userId);

        if (settingsEventError && settingsEventError.code !== '42P01') {
          console.error(
            `Error deleting settings events for user ${email}:`,
            settingsEventError
          );
        }
      } catch (error) {
        // Ignore table doesn't exist errors
      }

      // 7. Fix the foreign key issue - update files to remove transcriptionId first
      const { error: updateFileError } = await supabase
        .from(Tables.FILE)
        .update({ transcriptionId: null })
        .eq('userId', userId);

      if (updateFileError) {
        console.error(
          `Error updating files for user ${email}:`,
          updateFileError
        );
      }

      // 8. Delete transcriptions
      const { error: transcriptionError } = await supabase
        .from(Tables.TRANSCRIPTION)
        .delete()
        .eq('userId', userId);

      if (transcriptionError) {
        console.error(
          `Error deleting transcriptions for user ${email}:`,
          transcriptionError
        );
      }

      // 9. Delete files
      const { error: fileError } = await supabase
        .from(Tables.FILE)
        .delete()
        .eq('userId', userId);

      if (fileError) {
        console.error(`Error deleting files for user ${email}:`, fileError);
      }

      // 10. Delete user from User table
      const { error: deleteUserError } = await supabase
        .from(Tables.USER)
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        console.error(
          `Error deleting user ${email} from User table:`,
          deleteUserError
        );
        continue;
      }

      // 11. Delete user from auth.users
      const { error: deleteAuthError } =
        await supabase.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        console.error(`Error deleting auth user ${email}:`, deleteAuthError);
      } else {
        console.log(`Successfully deleted user ${email} and all related data`);
      }
    } catch (error) {
      console.error(`Unexpected error processing user ${email}:`, error);
    }
  }

  console.log('User deletion process completed');
}

// Check if script is run directly with command-line arguments
if (require.main === module) {
  // Get emails from command-line arguments if provided
  const cmdLineEmails = process.argv.slice(2);

  if (cmdLineEmails.length > 0) {
    console.log(
      `Using ${cmdLineEmails.length} emails from command line arguments`
    );
    deleteUsersWithData(cmdLineEmails).catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
  } else {
    console.log('No emails provided via command line, using default list');
    deleteUsersWithData().catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
  }
}
