import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-loader',
  template: `<div class="d-flex justify-content-center">
    <img style="width: 12vw" src="assets/infinity.svg" alt="Loading..." />
  </div> `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoaderComponent {}
