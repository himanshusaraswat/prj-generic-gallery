import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconButton, MatMenuTrigger, MatIcon, MatMenu, MatMenuItem]
})
export class UserMenuComponent {
  auth = inject(AuthService);
  currentUser = this.auth.currentUserSignal;
}
