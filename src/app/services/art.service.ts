import { Injectable } from '@angular/core';
import { embedDashboard, UiConfigType } from '@superset-ui/embedded-sdk';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ARTService {

  constructor() { }

  /**
   * Get guest token for ART authentication
   */
  getGuestToken(): Promise<string> {
    // Return token from environment (provided by ART admin)
    return Promise.resolve(environment.ART.token);
  }

  /**
   * Embed dashboard in the specified HTML element
   * @param dashboardId - Dashboard UUID provided by ART admin
   * @param element - HTML element to mount the dashboard
   * @param config - UI configuration options
   */
  async embedDashboard(
    dashboardId: string, 
    element: HTMLElement, 
    config: UiConfigType = {}
  ): Promise<void> {
    try {
      await embedDashboard({
        id: dashboardId,
        supersetDomain: environment.ART.domain,
        mountPoint: element,
        fetchGuestToken: () => this.getGuestToken(),
        dashboardUiConfig: {
          hideTitle: true,
          filters: {
            expanded: true,
          },
          ...config
        }
      });

      // Ensure iframe takes full container size
      const iframe = element.querySelector('iframe');
      if (iframe) {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
      }
    } catch (error) {
      console.error('Error embedding dashboard:', error);
      throw error;
    }
  }
}