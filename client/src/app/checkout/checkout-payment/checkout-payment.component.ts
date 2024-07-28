import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { loadStripe, Stripe, StripeCardCvcElement, StripeCardElement, StripeCardExpiryElement, StripeCardNumberElement } from '@stripe/stripe-js';
import { FormGroup } from '@angular/forms';
import { BasketService } from '../../basket/basket.service';
import { CheckoutService } from '../checkout.service';
import { ToastrService } from 'ngx-toastr';
import { Basket } from '../../shared/models/basket';
import { Address } from '../../shared/models/user';
import { NavigationExtras, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrderToCreate } from '../../shared/models/order';

@Component({
  selector: 'app-checkout-payment',
  templateUrl: './checkout-payment.component.html',
  styleUrl: './checkout-payment.component.scss'
})
export class CheckoutPaymentComponent implements OnInit {
   @Input() checkoutForm?: FormGroup;
   @ViewChild('cardNumber') cardNumberElement?: ElementRef;
   @ViewChild('cardExpiry') cardExpiryElement?: ElementRef;
   @ViewChild('cardCvc') cardCvcElement?: ElementRef;
   stripe: Stripe | null = null;
   cardNumber?: StripeCardNumberElement;
   cardExpiry?: StripeCardExpiryElement;
   cardCvc?: StripeCardCvcElement;
   cardNumberCompelete = false;
   cardExpiryCompelete = false;
   cardCvcCompelete = false;
   cardErrors: any;
   loading = false;

   constructor(
      private basketService: BasketService, 
      private checkoutService: CheckoutService, 
      private toastr: ToastrService,
      private router: Router) {}

  ngOnInit(): void {
    loadStripe('pk_test_51PcmNCCeRbD9L2LpDkRqCVADtFzOMtcxVik3Sax6R9eGZXTyulR99rsIO8FOjbQMikLjpq3gqsigzFIfaJxHKYIn00SGKcB066')
      .then(stripe => {
        this.stripe = stripe;
        const elements = stripe?.elements();
        if(elements) {
          this.cardNumber = elements.create('cardNumber');
          this.cardNumber.mount(this.cardNumberElement?.nativeElement);
          this.cardNumber.on('change', event => {
            this.cardNumberCompelete = event.complete;
            if(event.error) this.cardErrors = event.error.message;
            else this.cardErrors = null;
          });

          this.cardExpiry = elements.create('cardExpiry');
          this.cardExpiry.mount(this.cardExpiryElement?.nativeElement);
          this.cardExpiry.on('change', event => {
            this.cardExpiryCompelete = event.complete;
            if(event.error) this.cardErrors = event.error.message;
            else this.cardErrors = null;
          });

          this.cardCvc = elements.create('cardCvc');
          this.cardCvc.mount(this.cardCvcElement?.nativeElement);
          this.cardCvc.on('change', event => {
            this.cardCvcCompelete = event.complete;
            if(event.error) this.cardErrors = event.error.message;
            else this.cardErrors = null;
          });

          console.log(this.cardErrors);
        }
      });
  }

  get paymentFormCompelete() {
    return this.checkoutForm?.get('paymentForm')?.valid 
      && this.cardNumberCompelete 
      && this.cardExpiryCompelete 
      && this.cardCvcCompelete
  }

  async submitOrder() {
    this.loading = true;
    const basket = this.basketService.getCurrentBasketValue();

    try {
      const createOrder = await this.createOrder(basket);
      const paymentResult = await this.confirmPaymentWithStripe(basket);
      if (!basket) throw new Error('cannot get order')
      if(paymentResult.paymentIntent) {
        this.basketService.deleteBasket(basket);
        const navigationExtras: NavigationExtras = {state: createOrder};
        this.router.navigate(['checkout/success'], navigationExtras);
      } else {
        this.toastr.error(paymentResult.error.message);
      }
    } catch(error: any) {
      console.log(error);
      this.toastr.error(error.message);
    } finally {
      this.loading = false;
    }
  }
  private async confirmPaymentWithStripe(basket: Basket | null) {
    if(!basket) throw new Error('Basket is null');
    const result = this.stripe?.confirmCardPayment(basket.clientSecret!, {
      payment_method: {
        card: this.cardNumber!,
        billing_details: {
          name: this.checkoutForm?.get('paymentForm')?.get('nameCard')?.value
        }
      }
    })

    if(!result) throw new Error('Problem attempting payment with stripe');
    return result;
  }
  private async createOrder(basket: Basket | null) {
    if(!basket) throw new Error('Basket is null');
    const orderToCreate = this.getOrderToCreate(basket);
    return firstValueFrom(this.checkoutService.createOrder(orderToCreate));
  }

  private getOrderToCreate(basket: Basket): OrderToCreate {
    const deliveryMethodId = this.checkoutForm?.get('deliveryForm')?.get('deliveryMethod')?.value;
    const shipToAddress = this.checkoutForm?.get('addressForm')?.value as Address;
    if (!deliveryMethodId || !shipToAddress) throw new Error('Problem with basket');

    return {
      basketId: basket.id,
      deliveryMethodId: deliveryMethodId,
      shipToAddress: shipToAddress
    }
  }

}
