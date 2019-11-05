import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputDisplayComponent } from './input-display.component';

describe('InputDisplayComponent', () => {
  let component: InputDisplayComponent;
  let fixture: ComponentFixture<InputDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
