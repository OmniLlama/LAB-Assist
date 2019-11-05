import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { InputDisplayComponent } from './input-display/input-display.component';
import { InputEditorComponent } from './input-editor/input-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    InputDisplayComponent,
    InputEditorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
