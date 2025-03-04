import { supabase } from "@/integrations/supabase/client";

// Function to add joystick position to Supabase
export async function saveJoystickPosition(x: number, y: number): Promise<void> {
  try {
    console.log(`Saving position: x=${x}, y=${y}`);
    
    // Insert the new position
    const { data, error } = await supabase
      .from('joystick_positions')
      .insert({ x, y })
      .select();

    if (error) {
      console.error('Error saving position to Supabase:', error);
      throw error;
    }
    
    console.log('Position saved successfully:', data);

    // Keep only the latest 100 records
    await cleanupOldPositions();
    
    return;
  } catch (err) {
    console.error('Error in saveJoystickPosition:', err);
    throw err;
  }
}

// Function to fetch joystick position history
export async function getJoystickPositions(): Promise<{ x: number; y: number; created_at: string }[]> {
  try {
    console.log('Fetching joystick positions...');
    
    const { data, error } = await supabase
      .from('joystick_positions')
      .select('x, y, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching positions from Supabase:', error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} positions`);
    return data || [];
  } catch (err) {
    console.error('Error in getJoystickPositions:', err);
    throw err;
  }
}

// Private function to delete old records, keeping only the latest 100
async function cleanupOldPositions(): Promise<void> {
  try {
    // Get IDs of records to keep (newest 100)
    const { data: keepData, error: selectError } = await supabase
      .from('joystick_positions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (selectError) {
      console.error('Error selecting records to keep:', selectError);
      return;
    }

    if (!keepData || keepData.length < 100) {
      console.log('Not enough records to clean up yet.');
      return;
    }

    // Delete all records except the ones we want to keep
    const keepIds = keepData.map(item => item.id);
    const oldestIdToKeep = Math.min(...keepIds);

    console.log(`Cleaning up records with ID < ${oldestIdToKeep}`);
    
    const { error: deleteError } = await supabase
      .from('joystick_positions')
      .delete()
      .lt('id', oldestIdToKeep);

    if (deleteError) {
      console.error('Error cleaning up old positions:', deleteError);
    } else {
      console.log('Successfully cleaned up old records');
    }
  } catch (err) {
    console.error('Error in cleanupOldPositions:', err);
  }
}
