import { supabaseAdmin } from '../supabase-server';
import { sendEmail, emailTemplates } from './email';

export async function createNotification({ userId, type, title, message, link, metadata = {} }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    // Get user email for email notification
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Send email notification if user exists
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: `<h2>${title}</h2><p>${message}</p>`,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationRead(notificationId) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsRead(userId) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
