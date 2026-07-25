import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractFolderId(input: string): string | null {
  if (/^[a-zA-Z0-9_-]{10,}$/.test(input)) return input;
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function getApiKey(): Promise<string | null> {
  // First try app_settings table (admin-managed), then fall back to env var
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'GOOGLE_DRIVE_API_KEY')
      .single();
    if (data?.value) return data.value;
  } catch {
    // fall through to env var
  }

  return Deno.env.get('GOOGLE_DRIVE_API_KEY') || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderUrl } = await req.json();
    if (!folderUrl || typeof folderUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'folderUrl is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const folderId = extractFolderId(folderUrl.trim());
    if (!folderId) {
      return new Response(JSON.stringify({ error: 'Could not extract folder ID from the provided URL' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_DRIVE_API_KEY is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First, list ALL files in the folder (not just images) to debug
    const allQuery = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id,name,mimeType)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${allQuery}&fields=${fields}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true&key=${apiKey}`;

    console.log('Fetching Drive folder:', folderId);
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Google Drive API error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: data.error?.message || 'Failed to list files from Google Drive' }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Drive API returned files:', JSON.stringify(data.files?.map((f: any) => ({ name: f.name, mimeType: f.mimeType }))));

    // Filter to image types (including Google Drawings which can be exported as images)
    const imageFiles = (data.files || []).filter((file: { mimeType: string }) =>
      file.mimeType.startsWith('image/') ||
      file.mimeType === 'application/vnd.google-apps.photo'
    );

    const images = imageFiles.map((file: { id: string; name: string; mimeType: string }) => ({
      id: file.id,
      name: file.name,
      url: `https://lh3.googleusercontent.com/d/${file.id}`,
    }));

    return new Response(JSON.stringify({ images, count: images.length }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
