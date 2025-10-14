import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeiwBooksComponent } from './veiw-books.component';

describe('VeiwBooksComponent', () => {
  let component: VeiwBooksComponent;
  let fixture: ComponentFixture<VeiwBooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VeiwBooksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VeiwBooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
