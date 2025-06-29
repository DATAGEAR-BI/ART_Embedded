import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ARTService } from '../../services/art.service';
import { UiConfigType } from '@superset-ui/embedded-sdk';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Input() dashboardId!: string;
  @Input() config: UiConfigType = {};
  @Input() height: string = '600px';
  @Input() width: string = '100%';

  @ViewChild('dashboardContainer', { static: true }) 
  dashboardContainer!: ElementRef<HTMLElement>;

  loading = true;
  error: string | null = null;

  constructor(private artService: ARTService) { }

  async ngOnInit(): Promise<void> {
    if (!this.dashboardId) {
      this.error = 'Dashboard ID is required';
      this.loading = false;
      return;
    }

    try {
      await this.artService.embedDashboard(
        this.dashboardId,
        this.dashboardContainer.nativeElement,
        this.config
      );
      this.loading = false;
    } catch (error) {
      this.error = 'Failed to load dashboard';
      this.loading = false;
      console.error('Dashboard embedding error:', error);
    }
  }

  ngOnDestroy(): void {
    // Clean up embedded dashboard if needed
    if (this.dashboardContainer?.nativeElement) {
      this.dashboardContainer.nativeElement.innerHTML = '';
    }
  }
}