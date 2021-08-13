import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InputConverterComponent } from './input-converter.component';

describe('InputConverterComponent', () => {
  let component: InputConverterComponent;
  let fixture: ComponentFixture<InputConverterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InputConverterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputConverterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
