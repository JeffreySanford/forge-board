import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceStatusComponent } from './compliance-status.component';

describe('ComplianceStatusComponent', () => {
  let component: ComplianceStatusComponent;
  let fixture: ComponentFixture<ComplianceStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComplianceStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplianceStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
