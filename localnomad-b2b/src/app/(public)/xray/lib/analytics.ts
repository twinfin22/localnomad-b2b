// GA4 event helpers for X-Ray mini-app
// Events: page_view, university_search, panel_view, cta_click, form_submit

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

export function trackPageView(universityName?: string, utmSource?: string) {
  gtag('event', 'page_view', {
    university_name: universityName ?? '',
    utm_source: utmSource ?? '',
  });
}

export function trackUniversitySearch(universityName: string) {
  gtag('event', 'university_search', {
    university_name: universityName,
  });
}

export function trackPanelView(panelName: 'A' | 'B' | 'C') {
  gtag('event', 'panel_view', {
    panel_name: panelName,
  });
}

export function trackCtaClick(universityName: string, panelSource: string) {
  gtag('event', 'cta_click', {
    university_name: universityName,
    panel_source: panelSource,
  });
}

export function trackFormSubmit(universityName: string, challengeType: string) {
  gtag('event', 'form_submit', {
    university_name: universityName,
    challenge_type: challengeType,
  });
}

// UTM parameter extraction
export function extractUtmParams(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get('utm_source') ?? '',
    utmCampaign: searchParams.get('utm_campaign') ?? '',
    utmContent: searchParams.get('utm_content') ?? '',
  };
}
