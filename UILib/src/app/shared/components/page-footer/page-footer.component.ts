import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'page-footer',
  standalone: false,
  templateUrl: './page-footer.component.html',
  styleUrls: ['./page-footer.component.scss'],
})
export class PageFooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  appVersion: string = '1.0.0';

  ngOnInit(): void {
  
  }

  contactSupport(): void {
    console.log('Contact support clicked');
  }

 
  openPrivacyPolicy(): void {
    console.log('Privacy policy clicked');
  }

  openTermsOfService(): void {   
    console.log('Terms of service clicked');
    
  }
}