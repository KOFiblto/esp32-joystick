
import { supabase } from "@/integrations/supabase/client";

// Function to add joystick position to Supabase
export async function saveJoystickPosition(x: number, y: number): Promise<void> {
  try {
    console.log(`Saving position: x=${x}, y=${y}`);
    
    // Get the total count of records
    const { count, error: countError } = await supabase
      .from('joystick_positions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting positions:', countError);
      throw countError;
    }

    // If we have 100 or more records, update the oldest one
    if (count && count >= 100) {
      // Get the oldest record
      const { data: oldestData, error: oldestError } = await supabase
        .from('joystick_positions')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (oldestError) {
        console.error('Error finding oldest position:', oldestError);
        throw oldestError;
      }
      
      if (oldestData && oldestData.length > 0) {
        // Update the oldest record with new values
        const { data: updateData, error: updateError } = await supabase
          .from('joystick_positions')
          .update({ x, y, created_at: new Date().toISOString() })
          .eq('id', oldestData[0].id)
          .select();
          
        if (updateError) {
          console.error('Error updating position:', updateError);
          throw updateError;
        }
        
        console.log('Position updated successfully:', updateData);
        return;
      }
    }
    
    // If we have fewer than 100 records or couldn't find the oldest one, insert a new record
    const { data, error } = await supabase
      .from('joystick_positions')
      .insert({ x, y })
      .select();

    if (error) {
      console.error('Error saving position to Supabase:', error);
      throw error;
    }
    
    console.log('Position saved successfully:', data);
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
