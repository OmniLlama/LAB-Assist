import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputConverterComponent } from './input-converter.component';

describe('InputConverterComponent', () => {
  let component: InputConverterComponent;
  let fixture: ComponentFixture<InputConverterComponent>;

  beforeEach(async(() => {
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
