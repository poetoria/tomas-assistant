const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function transformGoogleUrl(url: string): string {
  // Google Docs
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([^/]+)/);
  if (docsMatch) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/export?format=txt`;
  }
  // Google Sheets
  const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/]+)/);
  if (sheetsMatch) {
    return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/export?format=csv`;
  }
  // Google Slides
  const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([^/]+)/);
  if (slidesMatch) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/export?format=txt`;
  }
  return url;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform Google Docs/Sheets/Slides URLs to export endpoints
    const originalUrl = formattedUrl;
    formattedUrl = transformGoogleUrl(formattedUrl);
    const isGoogleExport = formattedUrl !== originalUrl;

    console.log('Fetching style guide from URL:', formattedUrl, isGoogleExport ? '(Google export)' : '');

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Tomas-StyleGuide-Bot/1.0',
        'Accept': 'text/html, text/plain, application/json, */*',
      },
      redirect: 'follow',
    });

    if (response.status === 401 || response.status === 403) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied. Make sure the document is shared publicly ("Anyone with the link").' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await response.text();
    let markdown: string;

    if (isGoogleExport) {
      // Google export returns plain text directly
      markdown = text.trim();
    } else {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        markdown = text
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } else {
        markdown = text.trim();
      }
    }

    if (markdown.length > 100000) {
      markdown = markdown.substring(0, 100000) + '\n\n[Content truncated at 100,000 characters]';
    }

    console.log(`Extracted ${markdown.length} characters from URL`);

    return new Response(
      JSON.stringify({ success: true, markdown }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching URL:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
