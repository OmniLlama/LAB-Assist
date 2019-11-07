import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseExplorerComponent } from './database-explorer.component';

describe('DatabaseExplorerComponent', () => {
  let component: DatabaseExplorerComponent;
  let fixture: ComponentFixture<DatabaseExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatabaseExplorerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
