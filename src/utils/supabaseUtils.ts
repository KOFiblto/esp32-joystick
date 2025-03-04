import { supabase } from "@/integrations/supabase/client";

// Function to fetch, update, and overwrite the database with exactly 100 joystick positions
export async function saveJoystickPositions(history: { x: number; y: number }[]): Promise<void> {
  try {
    console.log("Fetching existing positions from database...");
    
    // Fetch current database entries
    const { data: existingData, error: fetchError } = await supabase
      .from('joystick_positions')
      .select('x, y, created_at')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching existing positions:', fetchError);
      throw fetchError;
    }
    
    console.log(`Fetched ${existingData?.length || 0} existing positions.`);
    
    // Merge existing data with new history
    let updatedPositions = [...existingData, ...history].slice(-100);
    while (updatedPositions.length < 100) {
      updatedPositions.unshift({ x: 0, y: 0, created_at: new Date().toISOString() }); // Add dummy entries if needed
    }
    
    // Overwrite the database with updated positions
    const { data, error: upsertError } = await supabase
      .from('joystick_positions')
      .upsert(updatedPositions, { onConflict: ['id'] });
    
    if (upsertError) {
      console.error('Error upserting positions:', upsertError);
      throw upsertError;
    }
    
    console.log("Positions saved successfully:", data);
  } catch (err) {
    console.error("Error in saveJoystickPositions:", err);
    throw err;
  }
}

// Function to fetch joystick position history
export async function getJoystickPositions(): Promise<{ x: number; y: number; created_at: string }[]> {
  try {
    console.log("Fetching joystick positions...");
    
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
}//Test
