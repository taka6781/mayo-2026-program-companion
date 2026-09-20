// Mayo 2026 Program Companion - runtime configuration
// Browser-safe values only. NEVER place a Supabase secret/service_role key here.
(() => {
  const isFilePreview = window.location.protocol === 'file:';
  const currentWebUrl = isFilePreview
    ? 'http://localhost:8000/'
    : new URL('./', window.location.href).href;

  window.MAYO_CONFIG = {
    // Directly opening OPEN_ME.html stays in Local Demo mode.
    // Serving the app via http://localhost:8000 or HTTPS uses Supabase Cloud Beta.
    dataMode: isFilePreview ? 'local' : 'supabase',
    supabaseUrl: 'https://qtufwebaxqvamhjaeeky.supabase.co',
    supabasePublishableKey: 'sb_publishable_JizmXib79c3WBRgqQ2Q7sg_Dg5RbYSN',
    authRedirectUrl: currentWebUrl,
    programName: 'Mayo 2026'
  };
})();
