import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('should create the app', () => {
    expect(new App()).toBeTruthy();
  });
});
