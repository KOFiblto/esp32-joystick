import { supabase } from "@/integrations/supabase/client";

// Function to add joystick position to Supabase
export async function saveJoystickPosition(x: number, y: number): Promise<void> {
  try {
    // Insert the new position
    const { error } = await supabase
      .from('joystick_positions')
      .insert({ x, y });

    if (error) {
      console.error('Error saving position to Supabase:', error);
    }

    // Keep only the latest 100 records
    cleanupOldPositions();
  } catch (err) {
    console.error('Error in saveJoystickPosition:', err);
  }
}

// Function to fetch joystick position history
export async function getJoystickPositions(): Promise<{ x: number; y: number; created_at: string }[]> {
  try {
    const { data, error } = await supabase
      .from('joystick_positions')
      .select('x, y, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching positions from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getJoystickPositions:', err);
    return [];
  }
}

// Private function to delete old records, keeping only the latest 100
async function cleanupOldPositions(): Promise<void> {
  try {
    // Get IDs of records to keep (newest 100)
    const { data: keepData } = await supabase
      .from('joystick_positions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!keepData || keepData.length < 100) return;

    // Delete all records except the ones we want to keep
    const keepIds = keepData.map(item => item.id);
    const oldestIdToKeep = Math.min(...keepIds);

    const { error } = await supabase
      .from('joystick_positions')
      .delete()
      .lt('id', oldestIdToKeep);

    if (error) {
      console.error('Error cleaning up old positions:', error);
    }
  } catch (err) {
    console.error('Error in cleanupOldPositions:', err);
  }
}
