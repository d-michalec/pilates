import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MetaPixelService } from './core/meta-pixel.service';
import { BanerZgod } from './layout/baner-zgod/baner-zgod';

@Component({
  selector: 'app-root',
  imports: [BanerZgod, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    /*
     * Serwis piksela musi powstać razem z aplikacją, a nie dopiero przy
     * pierwszym zdarzeniu: to on nasłuchuje zmiany zgody i to on zgłasza
     * odsłony przy nawigacji. Bez tego wywołania nikt by go nie utworzył,
     * bo reszta aplikacji sięga po niego dopiero w konkretnych miejscach.
     *
     * Sam w sobie nic nie ładuje - dopóki nie ma zgody marketingowej, nie
     * pobiera nawet skryptu Mety.
     */
    inject(MetaPixelService);
  }
}
