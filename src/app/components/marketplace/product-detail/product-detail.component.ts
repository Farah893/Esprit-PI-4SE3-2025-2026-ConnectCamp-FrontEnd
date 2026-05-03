import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualityBadgeComponent } from '../../quality-badge/quality-badge.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, QualityBadgeComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnChanges {
  @Input() product: any;
  @Output() back = new EventEmitter<void>();

  selectedOptions: { [key: string]: string } = {};
  selectedImage: string = '';

  ngOnChanges() {
    if (this.product) {
      this.selectedImage = this.product.image;
      if (this.product.options) {
        this.product.options.forEach((opt: any) => {
          if (opt.values.length > 0) {
            this.selectedOptions[opt.name] = opt.values[0];
          }
        });
      }
    }
  }

  goBack()  { this.back.emit(); }

  selectOption(optionName: string, value: string) {
    this.selectedOptions[optionName] = value;
  }
}
