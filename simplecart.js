// simple cart catalog functions
($ => {
    if (typeof $ === 'undefined') {
        console.warn('Simple cart need jQuery');
        return;
    }

    const defaults = {
        // localstorage key
        storage: 'catalog-cart',

        // auto init functions
        init: {
            listeners: true,
            handlers: true,
        },

        // cart view options
        cart: {
            // cart column headers
            columns: [
                {label: '', attr: 'thumb', view: null, class: null, style: 'width: 10%; text-align: center;'},
                {label: 'Title', attr: 'title', view: null, class: null, style: null},
                {label: 'Vendor code', attr: 'vendorcode', view: null, class: null, style: null},
                {label: '-', attr: 'decrement', view: null, class: null, style: 'width: 10%; text-align: center;'},
                {label: 'Quantity', attr: 'quantity', view: null, class: null, style: 'width: 15%;'},
                {label: '+', attr: 'increment', view: null, class: null, style: 'width: 10%; text-align: center;'},
                {label: 'Cost', attr: 'price', view: null, class: null, style: 'text-align: right;'},
                {label: 'Total', attr: 'total', view: null, class: null, style: 'text-align: right;'},
                {label: 'Remove', attr: 'remove', view: null, class: null, style: 'text-align: center;'},
            ],

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

            // before redirect
            delay: 10,

            // cart handler url
            url: '',
        },

        delivery: {
            // Example:
            // "Delivery and free condition": [
            //     {
            //         "uuid": "00000000-0000-0000-0000-000000000000", // catalog product with type 'service'
            //         "condition": "0" // cart total must be great
            //     },
            //     {
            //         "uuid": "00000000-0000-0000-0000-000000000000",
            //         "condition": "150"
            //     }
            // ],
        },

        payment: {
            // Example:
            // "00000000-0000-0000-0000-000000000000": "Cash",
            // "00000000-0000-0000-0000-000000000001": "Card"
        },

        // item type by default (e.g. 'product')
        item_type: 'product',

        // format settings
        format: {
            count: {decimalPlaces: 2, thousandsSeparator: ',', decimalSeparator: '.'}, // in item counts
            price: {decimalPlaces: 2, currencySymbolStart: '$',  currencySymbolEnd: '', thousandsSeparator: ',', decimalSeparator: '.'}, // in item prices and totals
        },

        // default selectors
        selectors: {
            'item': 'data-catalog-item', // item (e.g. product or service in catalog)
            'item-attr': 'data-catalog-item-attr', // item attr (price, color, etc)
            'item-attr-value': 'data-catalog-item-attr-value', // item attr value
            'item-add': 'data-catalog-item-add', // button add to cart
            'cart': 'data-catalog-cart', // cart place
            'cart-delivery': 'data-catalog-cart-delivery', // select delivery
            'cart-payment': 'data-catalog-cart-payment', // select payment method
            'cart-data': 'data-catalog-cart-data', // cart data (client field: name, phone, etc)
            'cart-checkout': 'data-catalog-cart-checkout', // button cart checkout
            'count-items': 'data-catalog-cart-count', // counter place (count items in cart)
            'count-total': 'data-catalog-cart-total', // counter place (count total price of items)
            'count-total-service': 'data-catalog-cart-total-service', // counter place (count total price of service)
            'count-total-all': 'data-catalog-cart-total-all', // counter place (count total)
        },

        // events handlers
        events: {
            'on:ready': null, // (cart) => {}
            'on:cart:add': null, // (new_item, cart) => {}
            'on:cart:update': null, // (updated_item, cart) => {}
            'on:cart:remove': null, // (cart) => {}
            'on:cart:remove:all': null, // (cart) => {}
            'on:cart:checkout:before': null, // ({FormData}, cart) => {}
            'on:cart:checkout:after': null, // ({FormData}, cart) => {}
        }
    };

    // private props
    let
        options = {},
        cart = {},
        delivery = null,
        $window = $(window),
        $document = $(window.document)
    ;

    window.catalog = new class {
        constructor(params) {
            options = merge({}, defaults, params);
            cart = readCartData();

            // auto init listeners
            if (options.init.listeners) {
                let focus = null;

                $window.on('event:catalog:ready event:catalog:cart:add event:catalog:cart:update event:catalog:cart:remove event:catalog:cart:remove:all', () => {
                    // render delivery options
                    $(getSelector('cart-delivery')).html(this.cartRenderDelivery()).trigger('change');

                    // render payment options
                    $(getSelector('cart-payment')).html(this.cartRenderPayment());

                    // render cart
                    let $cart = $(getSelector('cart')).html(this.cartRender());

                    $(getSelector('count-items')).attr(options.selectors['count-items'], this.cartCount(false)).text(this.cartCount(true));
                    $(getSelector('count-total')).attr(options.selectors['count-total'], this.cartTotal(false)).text(this.cartTotal(true, options.item_type));
                    $(getSelector('count-total-service')).attr(options.selectors['count-total-service'], this.cartTotal(false, 'service')).text(this.cartTotal(true, 'service'));
                    $(getSelector('count-total-all')).attr(options.selectors['count-total'], this.cartTotal(false)).text(this.cartTotal(true, null));

                    if (focus) {
                        $cart.find('[data-uuid="' + focus + '"] [data-attr="quantity"] input').focus();
                    }
                });

                // handler focus in cart
                $(getSelector('cart'))
                    .on('focus', '[data-attr="quantity"] input', (e) => {
                        focus = $(e.currentTarget).parents('[data-uuid]').attr('data-uuid');
                    })
                    .on('blur', '[data-attr="quantity"] input', () => {
                        focus = null;
                    });
            }

            // auto init handlers
            if (options.init.handlers) {
                $document.on('click', getSelector('item-add'), (e) => {
                    this.cartAddItemFromJQuery($(e.currentTarget).parents(getSelector('item')));
                });
                $document.on('click', getSelector('cart-checkout'), (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    this.cartCheckout($(`${getSelector('cart-data')}, ${getSelector('cart-payment')}`));
                });
                $document.on('change', getSelector('cart-delivery'), (e) => {
                    this.changeDelivery($(e.currentTarget).find('option:selected').data('uuid'));
                })
            }

            // ready
            setTimeout(() => triggerEvent('ready', cart), 100);
        }

        /**
         * Return current cart options
         */
        getOptions() {
            return options;
        }

        /**
         * Render cart in jQuery object
         * @return {*|jQuery|HTMLElement}
         */
        cartRender() {
            let
                $Tag = cartRenderGet$El,
                $root = $Tag('root').addClass(options.cart.class.container),
                $table = $Tag('table').addClass(options.cart.class.table),
                $thead = $Tag('thead'),
                $tbody = $Tag('tbody'),
                $items = $Tag('items')
            ;

            // table head
            if (options.cart.columns_header) {
                for (let column of options.cart.columns) {
                    let $column = $Tag('th').attr('data-attr', column.attr).html(column.label);

                    if (column.class) {
                        $column.addClass(column.class);
                    }
                    if (column.style) {
                        $column.attr('style', column.style);
                    }

                    $thead.append($column);
                }
            }

            // table body
            let grouped = groupBy(cart, 'group');
            for (let title in grouped) {
                if (!grouped.hasOwnProperty(title)) {
                    continue;
                }

                // group title
                if (options.cart.group_header && title) {
                    $tbody.append(
                        $Tag('tr')
                            .attr('data-group', title)
                            .attr('data-group-count', grouped[title].length)
                            .html(
                                $Tag('td')
                                    .attr('colspan', options.cart.columns.length)
                                    .text(title)
                            )
                    );
                }

                // cart items
                for (let item of grouped[title]) {
                    if (item.type === options.item_type) {
                        let $row = $Tag('tr')
                            .attr('data-uuid', item.uuid)
                            .attr('data-type', item.type)
                        ;

                        for (let column of options.cart.columns) {
                            let $column = $Tag('td')
                                .attr('data-label', column.label)
                                .attr('data-attr', column.attr)
                            ;

                            if (column.class) {
                                $column.addClass(column.class);
                            }
                            if (column.style) {
                                $column.attr('style', column.style);
                            }

                            if (!column.view) {
                                // draw by column type
                                switch (column.attr) {
                                    case 'title':
                                        $column.html(
                                            $('<span>')
                                                .text(item.title)
                                        );
                                        break;
                                    case 'url':
                                        $column.html(
                                            $('<a>')
                                                .attr('href', item.url)
                                                .attr('title', item.title)
                                                .text(item.title)
                                        );
                                        break;
                                    case 'thumb':
                                        $column.html(
                                            $('<img>')
                                                .attr('src', item.thumb)
                                                .attr('alt', item.title)
                                        );
                                        break;
                                    case 'decrement':
                                        $column.html(
                                            $('<button>')
                                                .addClass('btn btn-icon')
                                                .text('-')
                                                .on('click', () => {
                                                    this.cartItemDecrement(item.uuid, 'uuid');
                                                })
                                        );
                                        break;
                                    case 'increment':
                                        $column.html(
                                            $('<button>')
                                                .addClass('btn btn-icon')
                                                .text('+')
                                                .on('click', () => {
                                                    this.cartItemIncrement(item.uuid, 'uuid');
                                                })
                                        );
                                        break;
                                    case 'quantity':
                                        $column.html(
                                            $('<input>')
                                                .attr('type', 'number')
                                                .attr('pattern', '[0-9]*')
                                                .attr('inputmode', 'numeric')
                                                .attr('step', item.quantity_step || 1)
                                                .val(
                                                    formatNumber(item.quantity, {
                                                        ...options.format.count,
                                                        currencySymbolStart: '',
                                                        currencySymbolEnd: '',
                                                        thousandsSeparator: '',
                                                        decimalSeparator: '.'
                                                    })
                                                )
                                                .on('change', (e) => {
                                                    this.cartItemChangeCount($(e.currentTarget).val(), item.uuid, 'uuid');
                                                })
                                        );
                                        break;
                                    case 'price':
                                        $column.text(
                                            formatNumber(item[item.price_type], options.format.price)
                                        );
                                        break;
                                    case 'total':
                                        $column.text(
                                            formatNumber(item[item.price_type] * item.quantity, options.format.price)
                                        );
                                        break;
                                    case 'remove':
                                        $column.html(
                                            $('<button>')
                                                .addClass('btn btn-icon')
                                                .text('×')
                                                .on('click', () => {
                                                    this.cartRemoveItemByField(item.uuid, 'uuid');
                                                })
                                        );
                                        break;
                                    default:
                                        $column.text(item[column.attr]);
                                }
                            } else {
                                // custom view
                                $column.html(typeof column.view === 'function' ? column.view(item) : column.view);
                            }

                            $row.append($column);
                        }

                        $tbody.append($row);
                    }

                    // append system line with all item data
                    $items.append(
                        $('<input ' + options.selectors['cart-data'] + '>')
                            .attr('type', 'text')
                            .attr('name', 'item[' + item.uuid + ']')
                            .val(JSON.stringify(item))
                    );

                    // append system line with uuid => quantity
                    $items.append(
                        $('<input ' + options.selectors['cart-data'] + '>')
                            .attr('type', 'number')
                            .attr('name', 'list[' + item.uuid + '][count]')
                            .val(item.quantity)
                    );

                    // append system line with uuid => price_type
                    $items.append(
                        $('<input ' + options.selectors['cart-data'] + '>')
                            .attr('type', 'text')
                            .attr('name', 'list[' + item.uuid + '][price_type]')
                            .val(item.price_type)
                    );
                }
            }

            return $root
                .append(
                    $table
                        .append($thead)
                        .append($tbody)
                )
                .append($items);
        }

        /**
         * Render select options by rules
         * @return {*|jQuery|HTMLElement}
         */
        cartRenderDelivery() {
            let $delivery = $(getSelector('cart-delivery')),
                $collect = $();

            if ($delivery.length) {
                let selected = $delivery.val(),
                    total = this.cartTotal(false);

                for (let type in options.delivery) {
                    let items = options.delivery[type].sort(
                        (a, b) => parseFloat(b.condition) - parseFloat(a.condition)
                    );

                    for (let item of items) {
                        if (
                            (typeof item.condition === 'string' && total >= parseFloat(item.condition)) ||
                            (typeof item.condition === 'boolean' && item.condition.toString() === 'true')
                        ) {
                            let properties = getItemPropertiesFromJQuery($(getSelector('item', item.uuid)));

                            $collect = $collect.add(
                                $('<option>')
                                    .prop('selected', selected && selected === type)
                                    .data('uuid', item.uuid)
                                    .val(type)
                                    .text(properties.title)
                            );

                            break;
                        }
                    }
                }
            }

            return $collect;
        }

        /**
         * Render payment select options
         * @return {*|jQuery|HTMLElement}
         */
        cartRenderPayment() {
            let $payment = $(getSelector('cart-payment')),
                $collect = $();

            if ($payment.length) {
                let selected = $payment.val();

                for (let [uuid, title] of Object.entries(options.payment)) {
                    $collect = $collect.add(
                        $('<option>')
                            .prop('selected', selected && selected === uuid)
                            .val(uuid)
                            .text(title)
                    );
                }
            }

            return $collect;
        }

        changeDelivery(uuid) {
            if (this.cartTotal(false)) {
                if (uuid && uuid !== delivery) {
                    delivery = uuid;

                    // first remove exist
                    for (let type in options.delivery) {
                        for (let item of options.delivery[type]) {
                            this.cartRemoveItemByField(item.uuid, 'uuid');
                        }
                    }

                    // add item
                    let properties = getItemPropertiesFromJQuery($(getSelector('item', uuid)));
                    properties['uuid'] = uuid;
                    properties['price_type'] = 'price';
                    properties['quantity'] = 1;

                    this.cartAddItem(properties)
                }
            } else {
                if (delivery) {
                    // remove exist
                    for (let type in options.delivery) {
                        for (let item of options.delivery[type]) {
                            this.cartRemoveItemByField(item.uuid, 'uuid');
                        }
                    }

                    delivery = null;
                }
            }
        }

        /**
         * Add item to cart by jQuery object
         * @param $item
         * @return {number}
         */
        cartAddItemFromJQuery($item) {
            return this.cartAddItem(getItemPropertiesFromJQuery($item));
        }

        /**
         * Add item to cart (if duplicate - increment quantity)
         * @param properties
         * @return {number}
         */
        cartAddItem(properties) {
            let index,
                defaults = {
                    'uuid': '',
                    'title': '',
                    'url': '',
                    'thumb': '',
                    'vendorcode': '',
                    'price': 0,
                    'price_wholesale': 0,
                    'price_wholesale_from': 0,
                    'price_type': 'price', // price, price_wholesale
                    'quantity': 1,
                    'quantity_step': 1,
                    'quantity_min': 1,
                    'group': '',
                    'type': options.item_type,
                };

            properties = merge({}, defaults, properties);
            properties['quantity_step'] = properties['quantity_step'] ? +properties['quantity_step'] : 1;
            properties['quantity_min'] = properties['quantity_min'] ? +properties['quantity_min'] : 1;
            properties['quantity'] = properties['quantity'] >= properties['quantity_min'] ? +properties['quantity'] : properties['quantity_min'];
            properties['price'] = properties['price'] ? +properties['price'] : 0;
            properties['price_wholesale'] = properties['price_wholesale'] ? +properties['price_wholesale'] : 0;
            properties['price_wholesale_from'] = properties['price_wholesale_from'] ? +properties['price_wholesale_from'] : 0;
            properties['price_type'] = properties['price_wholesale_from'] > 0 && properties['quantity'] >= properties['price_wholesale_from'] ? 'price_wholesale' : 'price';

            if ((index = this.cartFindItemByField(properties['uuid'], 'uuid')) >= 0) {
                this.cartItemChangeCountById(index, cart[index].quantity + properties['quantity']);
            } else {
                cart.push(properties);
                triggerEvent('cart:add', properties);
            }
            saveCartData(cart);

            return cart.length;
        }

        // find item index by field value
        cartFindItemByField(value, field = 'uuid') {
            return cart.findIndex(obj => obj[field] === value);
        }

        /**
         * Increment item quantity
         * @param value
         * @param field
         */
        cartItemIncrement(value, field = 'uuid') {
            let index = this.cartFindItemByField(value, field);

            if (index >= 0) {
                this.cartItemChangeCountById(index, cart[index].quantity + cart[index].quantity_step);
            }
        }

        /**
         * Decrement item quantity
         * @param value
         * @param field
         */
        cartItemDecrement(value, field = 'uuid') {
            let index = this.cartFindItemByField(value, field);

            if (index >= 0) {
                this.cartItemChangeCountById(index, cart[index].quantity - cart[index].quantity_step);
            }
        }

        /**
         * Change item quantity
         * @param count
         * @param value
         * @param field
         */
        cartItemChangeCount(count, value, field = 'uuid') {
            let index = this.cartFindItemByField(value, field);

            if (index >= 0) {
                this.cartItemChangeCountById(index, count);
            }
        }

        /**
         * Change item quantity by id
         * @param index
         * @param count
         */
        cartItemChangeCountById(index, count) {
            if (index >= 0 && cart[index]) {
                cart[index].quantity = +count;

                let {quantity, quantity_min, quantity_step, price_wholesale_from} = cart[index];

                if (price_wholesale_from > 0 && quantity >= price_wholesale_from) {
                    cart[index].price_type = 'price_wholesale';
                } else {
                    cart[index].price_type = 'price';
                }

                if (quantity < quantity_min) {
                    this.cartRemoveItemById(index);
                } else {
                    let difference = quantity - quantity_min;

                    if (difference % quantity_step !== 0) {
                        cart[index].quantity = quantity_min + Math.ceil(difference / quantity_step) * quantity_step;
                    }
                }

                triggerEvent('cart:update', cart[index]);
                saveCartData(cart);
            }
        }

        /**
         * Remove item from cart by index
         * @param index
         */
        cartRemoveItemById(index) {
            if (index >= 0 && cart[index]) {
                cart.splice(index, 1);
                triggerEvent('cart:remove', cart);
                saveCartData(cart);
            }
        }

        /**
         * Remove item from cart by value of field
         * @param value
         * @param field
         */
        cartRemoveItemByField(value, field = 'uuid') {
            this.cartRemoveItemById(
                this.cartFindItemByField(value, field)
            );
        }

        /**
         * Remove all items from cart
         */
        cartRemoveAll() {
            cart = [];
            triggerEvent('cart:remove:all', cart);
            saveCartData(cart);
        }

        /**
         * Count of titles in cart by item_type
         * @return {string|number}
         */
        cartCount(ret_str = true) {
            if (cart.length) {
                let count = cart
                    .reduce((count, item) => item['type'] === options.item_type ? count + 1 : count, 0);

                return !ret_str ? count : formatNumber(count, options.format.count);
            }

            return 0;
        }

        /**
         * Total price of items in cart
         * @return {string|number}
         */
        cartTotal(ret_str = true, type = options.item_type) {
            if (cart.length) {
                let price = cart
                    .filter((el) => type ? el.type === type : true)
                    .map((el) => el.quantity * el[el.price_type])
                    .reduce((a, b) => a + b, 0);

                return !ret_str ? price : formatNumber(price, options.format.price);
            }

            return 0;
        }

        /**
         * Checkout cart
         * @param $fields list of cart data (by selector 'cart-data')
         * @return {Promise<void>}
         */
        async cartCheckout($fields) {
            let data = new FormData();

            $fields.each((i, el) => {
                if (el.required === true && el.value === '') {
                    el.classList.add('check-error');
                    throw new Error('Required field');
                }
                if (el.required === true && el.type === 'email') {
                    // todo replace regex
                    if (/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(el.value) === false) {
                        el.classList.add('check-error');
                        throw new Error('Invalid E-Mail address');
                    }
                }

                data.append(el.name, el.value);
            });

            triggerEvent('cart:checkout:before', data);

            $.ajax({
                url: options.cart.url || location.pathname,
                type: 'POST',
                data,
                contentType: false,
                cache: false,
                processData: false,
                success: (res) => {
                    if (res) {
                        if (res.redirect) {
                            triggerEvent('cart:checkout:after', data);

                            // flexibility
                            setTimeout(() => {this.cartRemoveAll(); location = res.redirect;}, options.cart.delay);
                        } else if (res.errors) {
                            for(let name in res.errors) {
                                $(getSelector('cart-data'))
                                    .filter('[name="' + name + '"]')
                                    .parents('[data-input]')
                                    .addClass('has-error');
                            }
                        }
                    }
                }
            });
        }
    }(window.catalog || {});

    /**
     * Generate element of cart structure by cart style
     *
     * @param tag
     * @return {*|jQuery|HTMLElement}
     */
    function cartRenderGet$El(tag) {
        let selector = '';

        switch (tag) {
            case 'root':
                selector = '<div>';
                break;
            case 'table': {
                switch (options.cart.style) {
                    case 'table':
                        selector = '<table>';
                        break;
                    case 'div':
                        selector = '<div>';
                        break;
                }
                break;
            }
            case 'thead': {
                switch (options.cart.style) {
                    case 'table':
                        selector = '<thead>';
                        break;
                    case 'div':
                        selector = '<div class="row">';
                        break;
                }
                break;
            }
            case 'th': {
                switch (options.cart.style) {
                    case 'table':
                        selector = '<th>';
                        break;
                    case 'div':
                        selector = '<div class="col">';
                        break;
                }
                break;
            }
            case 'tbody': {
                switch (options.cart.style) {
                    case 'table':
                        selector = '<tbody>';
                        break;
                    case 'div':
                        selector = '<div>';
                        break;
                }
                break;
            }
            case 'tr': {
                switch (options.cart.style) {
                    case 'table':
                        selector = '<tr>';
                        break;
                    case 'div':
                        selector = '<div class="row">';
                        break;
                }
                break;
            }
            case 'td': {
                switch (options.cart.style) {
                    case 'table':
                        selector = '<td>';
                        break;
                    case 'div':
                        selector = '<div class="col">';
                        break;
                }
                break;
            }
            case 'items':
                selector = '<noindex style="display: none;">';
                break;
        }

        return $(selector);
    }

    /**
     * Read cart data from localstorage
     * @return {any}
     */
    function readCartData() {
        return JSON.parse(localStorage.getItem(options.storage) || '[]');
    }

    /**
     * Save cart data to localstorage
     */
    function saveCartData(cart) {
        localStorage.setItem(options.storage, JSON.stringify(cart));
    }

    /**
     * Return selector name
     * @param selector
     * @return {*}
     */
    function getAttrName(selector) {
        return options.selectors[selector];
    }

    /**
     * Generate selector
     * @param selector
     * @param value
     * @return {string}
     */
    function getSelector(selector, value = false) {
        return '[' + getAttrName(selector) + (value ? '="' + value + '"' : '') + ']';
    }

    /**
     * Return item attrs
     * @param $item
     * @return object
     */
    function getItemPropertiesFromJQuery($item) {
        let properties = {},
            attr = getAttrName('item-attr');

        $item.find(getSelector('item-attr')).each((i, item) => {
            let $item = $(item);

            properties[$item.attr(attr)] = $item.val() || $item.text() || $item.attr(getAttrName('item-attr-value')) || '';
        });

        return properties;
    }

    /**
     * Event trigger
     * @param event
     * @param data
     */
    function triggerEvent(event, data) {
        $window.trigger('event:catalog:' + event, data, cart);

        // вызывает обработчик
        if (options.events['on:' + event]) {
            options.events['on:' + event](data, cart);
        }
    }

    /**
     * Cart item grouping
     * @param array
     * @param key
     * @return {*}
     */
    function groupBy(array, key) {
        return array.reduce((rv, x) => {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    }

    /**
     * Checks if item is object
     * @param item
     * @return {*|boolean}
     */
    function isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    /**
     * Merge two objects
     * @param target
     * @param sources
     * @return {*}
     */
    function merge(target, ...sources) {
        if (sources.length) {
            const source = sources.shift();

            if (isObject(target) && isObject(source)) {
                for (const key in source) {
                    if (source.hasOwnProperty(key)) {
                        if (isObject(source[key])) {
                            if (!target[key]) Object.assign(target, {[key]: {}});
                            merge(target[key], source[key]);
                        } else {
                            Object.assign(target, {[key]: source[key]});
                        }
                    }
                }
            }

            return merge(target, ...sources);
        }

        return target;
    }

    /**
     * Formating numbers
     * @param number
     * @param decimalPlaces
     * @param currencySymbolStart
     * @param currencySymbolEnd
     * @param thousandsSeparator
     * @param decimalSeparator
     * @returns {string}
     */
    function formatNumber(number, {decimalPlaces = 0, currencySymbolStart = '',  currencySymbolEnd = '', thousandsSeparator = '', decimalSeparator = ''}) {
        let roundedNumber = number.toFixed(decimalPlaces);
        let parts = roundedNumber.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

        let formattedNumber = parts.join(decimalSeparator);

        if (currencySymbolStart || currencySymbolEnd) {
            formattedNumber = `${currencySymbolStart}${formattedNumber}${currencySymbolEnd}`.trim();
        }

        return formattedNumber;
    }
})(window.jQuery);
