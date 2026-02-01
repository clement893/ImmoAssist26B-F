/**
 * Centris content script
 * Extracts listing data from the current Centris page and responds to popup messages.
 */

(function () {
  'use strict';

  /**
   * Extract listing data from Centris property page using DOM selectors.
   * Centris structure may change; adjust selectors as needed.
   */
  function extractCentrisData() {
    const data = {
      source_url: window.location.href,
      source_name: 'Centris',
      title: '',
      address: '',
      city: '',
      price: null,
      description: '',
      details: {},
      raw: {},
    };

    // Title - common selectors on Centris listing pages
    const titleEl =
      document.querySelector('[data-id="PageTitle"]') ||
      document.querySelector('.listing-title') ||
      document.querySelector('h1');
    if (titleEl) data.title = (titleEl.textContent || '').trim();

    // Address / location
    const addressEl =
      document.querySelector('[data-id="Address"]') ||
      document.querySelector('.address') ||
      document.querySelector('[itemprop="address"]');
    if (addressEl) data.address = (addressEl.textContent || '').trim();

    // Price
    const priceEl =
      document.querySelector('[data-id="Price"]') ||
      document.querySelector('.price') ||
      document.querySelector('[itemprop="price"]');
    if (priceEl) {
      const priceText = (priceEl.textContent || '').replace(/[^\d\s]/g, '').trim();
      const num = parseInt(priceText.replace(/\s/g, ''), 10);
      if (!isNaN(num)) data.price = num;
    }

    // Description
    const descEl =
      document.querySelector('[data-id="Description"]') ||
      document.querySelector('.description') ||
      document.querySelector('[itemprop="description"]');
    if (descEl) data.description = (descEl.textContent || '').trim();

    // Try to get structured data from JSON-LD if present
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd && jsonLd.textContent) {
      try {
        const ld = JSON.parse(jsonLd.textContent);
        if (Array.isArray(ld)) {
          const listing = ld.find((o) => o['@type'] === 'Product' || o['@type'] === 'RealEstateListing');
          if (listing) {
            data.raw.jsonLd = listing;
            if (listing.name) data.title = data.title || listing.name;
            if (listing.address) {
              data.address = data.address || [listing.address].flat().map((a) => (a.streetAddress || a).toString()).join(', ');
            }
            if (listing.offers && listing.offers.price) data.price = data.price || Number(listing.offers.price);
          }
        } else if (ld['@type']) {
          data.raw.jsonLd = ld;
        }
      } catch (_) {}
    }

    // Details table / list (e.g. bedrooms, bathrooms, area)
    const detailItems = document.querySelectorAll('[data-id="Detail"], .detail-item, .listing-detail');
    detailItems.forEach((el) => {
      const label = (el.querySelector('.label, [data-label]') || el).textContent?.trim() || 'item';
      const value = (el.querySelector('.value, [data-value]') || el).textContent?.trim() || '';
      if (label && value) data.details[label] = value;
    });

    return data;
  }

  /**
   * Handle message from popup requesting page data.
   */
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'GET_PAGE_DATA') {
      try {
        const data = extractCentrisData();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: (err && err.message) || 'Extraction failed' });
      }
    }
    return true; // keep channel open for async sendResponse
  });
})();
