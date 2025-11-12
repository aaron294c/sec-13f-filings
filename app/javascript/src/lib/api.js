/**
 * API Client for SEC 13F Filings
 * Maintains 100% compatibility with existing backend endpoints
 */

const BASE_URL = '';

class APIClient {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('[API] Fetching:', url);
      const response = await fetch(url, config);
      console.log('[API] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        console.log('[API] Response data:', json);
        return json;
      }

      return await response.text();
    } catch (error) {
      console.error(`[API] Error [${endpoint}]:`, error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Autocomplete search for managers and CUSIPs
  async autocomplete(query) {
    if (!query || query.length < 2) return { managers: [], cusips: [] };
    return this.get(`/data/autocomplete?q=${encodeURIComponent(query)}`);
  }

  // Get filing holdings (aggregated)
  async getFiling(externalId) {
    return this.get(`/data/13f/${externalId}`);
  }

  // Get filing holdings (detailed)
  async getFilingDetailed(externalId) {
    return this.get(`/data/13f/${externalId}/detailed`);
  }

  // Compare two filings
  async compareFilings(externalId, otherExternalId) {
    return this.get(`/data/13f/${externalId}/compare/${otherExternalId}`);
  }

  // Get all holders of a CUSIP in a quarter
  async getCusipHolders(cusip, year, quarter) {
    return this.get(`/data/cusip/${cusip}/${year}/${quarter}`);
  }

  // Get manager's history for a CUSIP
  async getManagerCusipHistory(cik, cusip) {
    return this.get(`/data/manager/${cik}/cusip/${cusip}`);
  }

  // Get list of all managers (paginated)
  async getManagers(page = 1, perPage = 50, search = '') {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return this.get(`/data/managers?page=${page}&per_page=${perPage}${searchParam}`);
  }

  // Get newest/recent filings
  async getNewestFilings(page = 1, perPage = 100) {
    return this.get(`/data/newest?page=${page}&per_page=${perPage}`);
  }

  // Get a manager's filings history
  async getManagerFilings(cik, page = 1, perPage = 50) {
    return this.get(`/data/manager/${cik}/filings?page=${page}&per_page=${perPage}`);
  }
}

export const api = new APIClient();
export default api;
