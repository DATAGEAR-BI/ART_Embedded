# ART (ARTV3) Angular Integration Guide

## Overview

This guide provides step-by-step instructions for integrating ART (ARTV3) dashboards into any Angular application using the Superset Embedded SDK.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Project Setup](#project-setup)
4. [Service Implementation](#service-implementation)
5. [Component Creation](#component-creation)
6. [Configuration](#configuration)
7. [Usage Examples](#usage-examples)

## Prerequisites

- Angular 15+ application
- Node.js and npm
- Access to ART (ARTV3) instance
- ART administrator provided credentials:
  - Domain URL
  - Guest token
  - Dashboard ID(s)

## Installation

### Step 1: Install Superset Embedded SDK

```bash
npm install @superset-ui/embedded-sdk
```


## Project Setup

### Step 1: Create Environment Configuration

Create or update your environment files:

**`src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  ART: {
    domain: 'http://localhost:8088', // Provided by ART admin
    token: 'your-guest-token-here'   // Provided by ART admin
  }
};
```

**`src/environments/environment.prod.ts`**
```typescript
export const environment = {
  production: true,
  ART: {
    domain: 'https://your-art-domain.com', // Provided by ART admin
    token: 'your-production-token'         // Provided by ART admin
  }
};
```

## Service Implementation

### Step 1: Create ART Service

Generate the service:
```bash
ng generate service services/art
```

**`src/app/services/art.service.ts`**
```typescript
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
```

### Step 2: Update App Module (if using NgModules)

**`src/app/app.module.ts`**
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ARTService } from './services/art.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [ARTService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Component Creation

### Step 1: Create Dashboard Component

Generate the component:
```bash
ng generate component components/dashboard
```

**`src/app/components/dashboard/dashboard.component.ts`**
```typescript
import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ARTService } from '../../services/art.service';
import { UiConfigType } from '@superset-ui/embedded-sdk';

@Component({
  selector: 'app-dashboard',
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
```

**`src/app/components/dashboard/dashboard.component.html`**
```html
<div class="dashboard-wrapper" [style.height]="height" [style.width]="width">
  <!-- Loading State -->
  <div *ngIf="loading" class="dashboard-loading">
    <div class="spinner"></div>
    <p>Loading dashboard...</p>
  </div>

  <!-- Error State -->
  <div *ngIf="error" class="dashboard-error">
    <p>{{ error }}</p>
    <button (click)="ngOnInit()" class="retry-button">Retry</button>
  </div>

  <!-- Dashboard Container -->
  <div 
    #dashboardContainer 
    class="dashboard-container"
    [style.height]="height"
    [style.width]="width">
  </div>
</div>
```

**`src/app/components/dashboard/dashboard.component.css`**
```css
.dashboard-wrapper {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.dashboard-container {
  width: 100%;
  height: 100%;
}

.dashboard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #d32f2f;
  text-align: center;
  padding: 20px;
}

.retry-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-button:hover {
  background-color: #2980b9;
}
```

## Configuration

### Default Configuration Options

```typescript
// Common dashboard configurations
export const DASHBOARD_CONFIGS = {
  // Minimal - hide most UI elements
  minimal: {
    hideTitle: true,
    hideTab: true,
    hideChartControls: true,
    filters: {
      visible: false
    }
  },

  // Standard - show essential elements
  standard: {
    hideTitle: false,
    hideTab: false,
    filters: {
      expanded: true,
      visible: true
    }
  },

  // Full - show all elements
  full: {
    hideTitle: false,
    hideTab: false,
    hideChartControls: false,
    filters: {
      expanded: true,
      visible: true
    }
  }
};
```

## Usage Examples

### Basic Usage

```typescript
// In your component
export class AppComponent {
  dashboardId = 'dashboard-uuid-from-art-admin';
}
```

```html
<!-- In your template -->
<app-dashboard 
  [dashboardId]="dashboardId"
  height="500px">
</app-dashboard>