import { describe, it, expect, beforeEach } from 'vitest';
import { LoaderService } from './loader.service';

describe('LoaderService (Zoneless Signal)', () => {
  let service: LoaderService;

  beforeEach(() => {
    service = new LoaderService();
  });

  it('should initialize with loading set to true by default', () => {
    expect(service.loadingSignal()).toBe(true);
  });

  it('should update loading signal to false when setLoaderTo(false) is called', () => {
    service.setLoaderTo(false);
    expect(service.loadingSignal()).toBe(false);
  });

  it('should toggle loading state accurately between true and false', () => {
    service.setLoaderTo(false);
    expect(service.loadingSignal()).toBe(false);

    service.setLoaderTo(true);
    expect(service.loadingSignal()).toBe(true);
  });
});
