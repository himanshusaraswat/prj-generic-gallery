import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../snack-bar/snack-bar.component';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {
  private _snackBar = inject(MatSnackBar);

  openSnackBar(_data: string | { message: string }) {
    this._snackBar.openFromComponent(SnackBarComponent, { data: _data });
  }
}
