import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { PlaybackService } from '../../providers/playback.service';

@Component({
  selector: 'main-page',
  template: '<router-outlet></router-outlet>'
  // templateUrl: './main-page.component.html',
  // styleUrls: ['./main-page.component.css']
})
export class MainPageComponent {

}
