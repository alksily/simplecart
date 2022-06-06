SimpleCart.js
====
_(Simple JavaScript code for eCommerce catalog cart)_

See our demo version: https://alksily.github.io/simplecart/

A simple javascript shopping cart that you can setup in minutes. It's lightweight, fast, simple to use, and completely customizable.

**Depends on**: jQuery

#### Quick Start
To get started, just add config, and the SimpleCart javascript file to your page:
```html
<body>
    <script>
        window.catalog = {
            cart: {
                columns: [
                    {label: 'Title', attr: 'title', view: null, class: null, style: 'text-align: center;'},
                    {label: 'Code', attr: 'vendorcode', view: null, class: null, style: 'text-align: center;'},
                    {label: '-', attr: 'decrement', view: null, class: null, style: 'width: 10%; text-align: center;'},
                    {label: 'Quantity', attr: 'quantity', view: null, class: null, style: 'width: 15%;'},
                    {label: '+', attr: 'increment', view: null, class: null, style: 'width: 10%; text-align: center;'},
                    {label: 'Cost', attr: 'price', view: null, class: null, style: 'text-align: center;'},
                    {label: 'Total', attr: 'total', view: null, class: null, style: 'text-align: center;'},
                    {label: 'Remove', attr: 'remove', view: null, class: null, style: 'text-align: center;'},
                ],
            }
        }
    </script>
    <script src="simplecart.js"></script>
</body>
```
Column options: ```title, url, thumb, decrement, increment, quantity, price, total, remove```.

**Other cart options**
```javascript
window.catalog = {
    cart: { 
        // showing header
        columns_header: true,
        
        // showing items group title
        group_header: true,
        
        // table style ('table' or 'div')
        style: 'table',
        
        // cart table class
        class: {
            table: 'table',
            container: 'cart-container',
        },
        
        // cart handler url
        url: '',
    },
    
}
```

If you want to change options, like the precision or currency, you can do that as well:
```javascript
window.catalog = {
    cart: { /* ... */ },
    
    precision: {
        count: 0, // in items counts
        price: 2, // in items prices and totals
    },
    currency: {
        position: 'after', // or 'before'
        symbol: '$',
    },
}
```

**Shelf item**

To sell items, you add them to your "Shelf" by simply adding a few `attributes` to your html:
```html
<!-- Shelf item -->
<div class="col-xl-3 col-sm-6 mb-5 mx-auto" data-catalog-item>
    <div class="card text-center" data-catalog-item-attr="uuid" data-catalog-item-attr-value="3">
        <div class="card-body">
            <h5>Item</h5>
            <h4 class="card-title"><strong><a href="" data-catalog-item-attr="title">Product 3</a></strong></h4>
        </div>
        <div class="card-footer text-muted">
            <span class="float-left p-1" data-catalog-item-attr="price">64$</span>
            <span class="float-right">
                <button class="btn btn-sm btn-link" type="button" data-catalog-item-add>In cart</button>
            </span>
        </div>
    </div>
</div>
<!-- End -->
```

Set your name for attributes
```javascript
window.catalog = {
    cart: { /* ... */ },
    
    /* ... */

    selectors: {
        'item': 'data-catalog-item', // item (e.g. product or service in catalog)
        'item-attr': 'data-catalog-item-attr', // item attr (price, color, etc)
        'item-attr-value': 'data-catalog-item-attr-value', // item attr value
        'item-add': 'data-catalog-item-add', // button add to cart
        'cart': 'data-catalog-cart', // cart place
        'cart-data': 'data-catalog-cart-data', // cart data (client field: name, phone, etc)
        'cart-checkout': 'data-catalog-cart-checkout', // button cart checkout
        'count-items': 'data-catalog-cart-count', // counter place (count items in cart)
        'count-total': 'data-catalog-cart-total', // counter place (count total price of items)
    },
}
```

**Shelf item attributes**

You can use almost any type of html tag, and set any values for the item you want by adding `attributes`:
```html
<div style="display: none;">
    <span data-catalog-item-attr="uuid"  data-catalog-item-attr-value="3">3</span>
    <span data-catalog-item-attr="title">Product 3</span>
    <span data-catalog-item-attr="vendorcode">303.449.11</span>
    <span data-catalog-item-attr="price">64.00</span>
</div>
```

Product attributes that we provided in advance (you can expand it if you need), 
use the `uuid` field as product id:
```
{
    "uuid": "",
    "url": "", // product url
    "thumb": "", // picture url 
    "title": "",
    "price": 0,
    "vendorcode": "",
    "group": "", // use to group items in the cart table
    "quantity": 1, // this attribute can be specified in the input tag
    "quantity_step": 1 // e.g. product is liquid, you can specify 0.1 as 100ml
}
```

**Cart place**

Place attribute in your place:
```html
<div data-catalog-cart></div>
```

**Client field**
```html
<div class="col-md-6 mb-4">
    <label for="firstName">First name (*)</label>
    <input type="text" id="firstName" name="firstName" class="form-control" data-catalog-cart-data required>
</div>
<div class="col-md-6 mb-2">
    <label for="lastName">Last name (*)</label>
    <input type="text" id="lastName" name="lastName" class="form-control" data-catalog-cart-data required>
</div>
```

**Cart checkout button**
```html
<button class="btn btn-primary" data-catalog-cart-checkout type="button">
    Place order
</button>
```

#### Events
You can define event functions:
```javascript
window.catalog = {
    /* ... */

    events: {
        'on:ready': function (data, cart) { /* ... */ },
        'on:cart': null,
        'on:cart:add': null,
        'on:cart:update': null,
        'on:cart:remove': null,
        'on:cart:remove:all': null,
        'on:cart:checkout:before': null,
        'on:cart:checkout:after': null,
    }
}
```

or jQuery:
```javascript
$(window).on('event:catalog:ready', (data, cart) => { /* ... */ });
```

#### Cart counters
Counter **items** in cart and **total price**:
```html
<div class="col-lg-8 mx-auto">
    In cart <span data-catalog-cart-count>0</span> items
    on total cost <span data-catalog-cart-total>0</span>
</div>
```

#### Self handled
You can turn off automatic script initialization and use the API:
```javascript
window.catalog = {
    /* ... */

    // auto init functions
    init: {
        listeners: true,
        handlers: true,
    }
}
```

**API**
```javascript
// add item by jQuery
window.catalog.cartAddItemFromJQuery($('[data-catalog-item]'));

// add item by attributes
window.catalog.cartAddItem({ /* ... */ });

// find item by value and field
window.catalog.cartFindItemByField(value, field = 'uuid');
// will find item where title = 'Product 3'
// window.catalog.cartFindItemByField('Product 3', 'title');

// increment item count (i.e. +1)
window.catalog.cartItemIncrement(value, field = 'uuid');

// decrement item count (i.e. -1)
window.catalog.cartItemDecrement(value, field = 'uuid');

// set item count
window.catalog.cartItemChangeCount(count, value, field = 'uuid');

// remove item from cart
window.catalog.cartRemoveItemByField(value, field = 'uuid');

// clear cart
window.catalog.cartRemoveAll();

// get count items in cart
window.catalog.cartCount();

// get total price of items in cart
window.catalog.cartTotal();

// checkout cart with cart data
window.catalog.cartCheckout($('[data-catalog-cart-data]'));
```

#### License
Licensed under the MIT license. See [License File](LICENSE.md) for more information.
