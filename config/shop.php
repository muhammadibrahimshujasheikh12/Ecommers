<?php

/*
 * Brand and business details used across the site, read with config('shop.*').
 * Delivery rates are NOT here: they live in the shipping_methods table.
 */
return [
    'name' => 'Closet Stories',
    'tagline' => 'Everyday fashion for women, men and kids',
    'description' => 'Closet Stories — everyday fashion for women, men and kids, with nationwide delivery.',

    // Shown in the header, footer and contact page; phone_href is the tap-to-call link.
    'contact' => [
        'phone' => '+92 300 1550001',
        'phone_href' => 'tel:+923001550001',
        'whatsapp' => 'https://wa.me/923001550001',
        'email' => 'info@theclosetstoriespk.com',
        'address' => 'Shop # 3, M-11 Karachi Play House, 3 Talwar, Clifton, Karachi',
        'hours' => 'Mon–Sat, 10am–8pm PKT',
    ],

    'instagram' => 'https://instagram.com/closetstories.official',

    // Rotating messages in the top announcement bar.
    'announcements' => [
        'Delivery Rs. 500 in Karachi · Rs. 1,000 across Pakistan',
        'Cash on delivery & bank transfer available',
        'New in: cardigans & knitwear',
    ],

    // Departments shown in the menu and on the home page.
    'departments' => [
        ['slug' => 'women', 'name' => 'Women', 'image' => '/images/departments/women.jpg'],
        ['slug' => 'men', 'name' => 'Men', 'image' => '/images/departments/men.jpg'],
        ['slug' => 'kids', 'name' => 'Kids', 'image' => '/images/departments/kids.jpg'],
    ],

    // Shown at checkout, on the confirmation page and in the order email when
    // Bank Transfer is chosen.
    'bank_transfer' => [
        'details' => [
            'Account title' => 'SHAIKH ANAS RAZA',
            'Account number' => '10480115663600',
            'IBAN' => 'PK95MEZN0010480115663600',
            'Branch' => 'CH KHALIQ UZ ZAMAN',
        ],
        'note' => 'After making the payment, please send a screenshot of the payment receipt via WhatsApp to +92 300 1550001 for order confirmation.',
    ],

    // The only payment options offered; keys are stored in orders.payment_method.
    'payment_methods' => [
        'cod' => ['label' => 'Cash on Delivery', 'description' => 'Pay in cash when your order arrives. Available nationwide.'],
        'bank_transfer' => ['label' => 'Bank Transfer', 'description' => 'Transfer the order total to our bank account. Your order ships once payment is confirmed.'],
    ],

    // The admin account; its password comes from ADMIN_PASSWORD in .env.
    'admin_email' => env('ADMIN_EMAIL', 'closetstoriesclothing@gmail.com'),
    'admin_password' => env('ADMIN_PASSWORD'),

    // Order emails are copied to this address.
    'orders_bcc' => env('ORDERS_BCC', 'closetstoriesclothing@gmail.com'),
];
