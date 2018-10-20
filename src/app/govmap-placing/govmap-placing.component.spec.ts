import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GovmapPlacingComponent } from './govmap-placing.component';

describe('GovmapPlacingComponent', () => {
  let component: GovmapPlacingComponent;
  let fixture: ComponentFixture<GovmapPlacingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GovmapPlacingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GovmapPlacingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
