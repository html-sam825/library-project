import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderApprovalsComponent } from './order-approvals.component';

describe('OrderApprovalsComponent', () => {
  let component: OrderApprovalsComponent;
  let fixture: ComponentFixture<OrderApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderApprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
