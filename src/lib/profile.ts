import { supabase } from './supabase';

export interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createCustomerProfile(
  userId: string,
  profileData: ProfileFormData
): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .insert({
      user_id: userId,
      ...profileData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return data;
}

export async function updateCustomerProfile(
  userId: string,
  profileData: Partial<ProfileFormData>
): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .update(profileData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

export async function upsertCustomerProfile(
  userId: string,
  profileData: ProfileFormData
): Promise<CustomerProfile | null> {
  const { data, error } = await supabase
    .from('customer_profiles')
    .upsert(
      {
        user_id: userId,
        ...profileData,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting profile:', error);
    return null;
  }

  return data;
}
