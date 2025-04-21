import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-metrics-indicator',
  templateUrl: './metrics-indicator.component.html',
  styleUrls: ['./metrics-indicator.component.scss']
})
export class MetricsIndicatorComponent implements OnInit {
  cpu = 0;
  memory = 0;
  connectionStatus = false;
  time = '';

  ngOnInit() {
    setInterval(() => {
      this.cpu = Math.floor(Math.random() * 100);
      this.memory = Math.floor(Math.random() * 100);
      this.connectionStatus = Math.random() > 0.2;
      this.time = new Date().toLocaleTimeString();
    }, 1000);
  }
}
