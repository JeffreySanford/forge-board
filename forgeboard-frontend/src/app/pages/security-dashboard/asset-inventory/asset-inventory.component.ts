import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-asset-inventory',
  standalone: false,
  templateUrl: './asset-inventory.component.html',
  styleUrl: './asset-inventory.component.scss'
})
export class AssetInventoryComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('[Logger] Navigated to Asset Inventory tab:', this.router.url);
  }
}
