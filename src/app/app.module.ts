import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { InputDisplayComponent } from './input-display/input-display.component';
import { InputEditorComponent } from './input-editor/input-editor.component';
import { DatabaseExplorerComponent } from './database-explorer/database-explorer.component';
import { InputConverterComponent } from './input-converter/input-converter.component';

@NgModule({
  declarations: [
    AppComponent,
    InputDisplayComponent,
    InputEditorComponent,
    DatabaseExplorerComponent,
    InputConverterComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    // AngularFireModule.initializeApp(environment.firebase),
    // AngularFirestoreModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
