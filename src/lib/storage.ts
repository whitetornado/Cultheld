import { supabase } from './supabase';

export async function uploadLegendImage(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('legends')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage.from('legends').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadShirtTemplate(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('shirt-templates')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage.from('shirt-templates').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadProductMockup(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('product-mockups')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage.from('product-mockups').getPublicUrl(filePath);
  return data.publicUrl;
}

export function deleteFileFromUrl(url: string, bucket: 'legends' | 'shirt-templates' | 'product-mockups') {
  const path = url.split(`/${bucket}/`)[1];
  if (path) {
    return supabase.storage.from(bucket).remove([path]);
  }
  return Promise.resolve({ data: null, error: null });
}
