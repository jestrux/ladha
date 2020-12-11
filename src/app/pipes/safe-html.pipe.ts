import { Pipe, PipeTransform } from '@angular/core';
import {BrowserModule, DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {

  constructor(private sanitizer:DomSanitizer){}

  transform(value: any) {
    return this.sanitizer.bypassSecurityTrustUrl(value);
  }

}
