import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loading = signal(true);
  public loadingSignal = this.loading.asReadonly();

  setLoaderTo(value: boolean) {
    this.loading.set(value);
  }
}
