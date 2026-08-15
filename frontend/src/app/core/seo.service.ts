import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

interface SeoConfig {
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta
  ) {}

  set(config: SeoConfig) {
    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }
}
