import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { ACTION_ERROR } from '../shared/constants';
@Component({
  selector: 'app-snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon]
})
export class SnackBarComponent {
  data = inject(MAT_SNACK_BAR_DATA);

  actionError = ACTION_ERROR;
}
