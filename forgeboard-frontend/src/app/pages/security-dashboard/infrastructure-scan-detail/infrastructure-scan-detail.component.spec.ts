import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrastructureScanDetailComponent } from './infrastructure-scan-detail.component';

describe('InfrastructureScanDetailComponent', () => {
  let component: InfrastructureScanDetailComponent;
  let fixture: ComponentFixture<InfrastructureScanDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InfrastructureScanDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrastructureScanDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
