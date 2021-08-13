import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DatabaseExplorerComponent } from './database-explorer.component';

describe('DatabaseExplorerComponent', () => {
  let component: DatabaseExplorerComponent;
  let fixture: ComponentFixture<DatabaseExplorerComponent>;

  beforeEach(waitForAsync(() => {
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
