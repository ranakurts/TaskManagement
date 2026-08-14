import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceCard } from './workspace-card';

describe('WorkspaceCard', () => {
  let component: WorkspaceCard;
  let fixture: ComponentFixture<WorkspaceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceCard],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
