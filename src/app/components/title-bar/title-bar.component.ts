import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'title-bar',
  templateUrl: './title-bar.component.html',
  styleUrls: ['./title-bar.component.css']
})
export class TitleBarComponent {
  static ACTION_CLOSE: number = 0;
  static ACTION_MINIMIZE: number = 1;
  static ACTION_MAXIMIZE: number = 2;

  @Input() background: String = "transparent";
  @Input() color: String = "#000";

  @Input() maximized = false;
  @Input() header = "";
  @Input() noHeader = false;
  @Input() hasBack = false;
  @Input() closeOnly = false;
  @Input() noMaximize = false;

  @Output() onAction = new EventEmitter();

  actionClicked(action){
    this.onAction.emit(action);
  }
}
