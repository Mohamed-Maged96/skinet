import { Component, Input, OnInit } from '@angular/core';
import { Product } from '../../shared/models/product';
import { BasketService } from '../../basket/basket.service';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss']
})
export class ProductItemComponent implements OnInit {
  @Input() product?: Product;

  constructor(private basketService: BasketService) {}

  ngOnInit(): void {

  }

  addItemToBasket() {
    this.product && this.basketService.addItemToBasket(this.product);
  }

}
