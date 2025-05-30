import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SbomStatusDetailComponent } from './sbom-status-detail.component';

describe('SbomStatusDetailComponent', () => {
  let component: SbomStatusDetailComponent;
  let fixture: ComponentFixture<SbomStatusDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SbomStatusDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SbomStatusDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
