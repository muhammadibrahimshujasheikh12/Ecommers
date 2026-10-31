# Closet Stories (Laravel)

The Closet Stories online shop: everyday clothing for women, men and kids, delivered across Pakistan.

## Tech stack

- PHP 8.4 or newer (built on 8.5) with Laravel 13
- Blade templates, Tailwind CSS 4 and plain JavaScript, built with Vite
- SQLite by default. For MySQL, change the `DB_*` settings in `.env`.
- PHPUnit feature tests

## Run it locally

You need PHP 8.4+, Composer and Node.js 20.19+ (or 22.12+).

```bash
composer run setup
```

This one command:

1. installs the PHP and npm packages
2. creates `.env` and the app key
3. creates the SQLite database and its tables
4. builds the CSS and JavaScript

Next, open `.env` and set `ADMIN_PASSWORD`. `ADMIN_EMAIL` is already filled in; change it if needed. Then load the products and create the admin account:

```bash
php artisan db:seed
php artisan serve
```

- Shop: http://127.0.0.1:8000
- Admin: http://127.0.0.1:8000/admin. Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

You can run the seeder again safely. Products are only imported into an empty shop, so a second run never resets stock or your admin edits. It only updates the admin account, for example after you change `ADMIN_PASSWORD`.

## Where things live

| What | Where |
| --- | --- |
| Delivery rates: Rs 500 in Karachi, Rs 1,000 elsewhere in Pakistan, Rs 6,500 international | `shipping_methods` table, first loaded from `database/data/catalog.json` |
| Bank details, payment methods, contact details, announcements | `config/shop.php` |
| Products, categories and info pages (first import) | `database/data/catalog.json` |
| Product photos | `public/images/products` (the admin's photo uploads also go here) |
| Pages, layouts and the order email | `resources/views` |
| URLs | `routes/web.php` |
| Styles and scripts | `resources/css/app.css`, `resources/js/app.js` |

Checkout offers only Cash on Delivery and Bank Transfer. If a customer picks Bank Transfer, the checkout page, the confirmation page and the order email all show the bank details and the WhatsApp receipt note.

## Order emails

Out of the box, emails are only written to `storage/logs/laravel.log` (`MAIL_MAILER=log`). To really send them, add your SMTP settings to `.env`:

- `MAIL_MAILER=smtp`
- `MAIL_HOST`, `MAIL_PORT`
- `MAIL_USERNAME`, `MAIL_PASSWORD`
- `MAIL_FROM_ADDRESS`

A copy of every order email goes to `ORDERS_BCC`.

## Tests

```bash
php artisan test
```

## Deploying

The site runs on any PHP 8.4+ host, such as cPanel, a VPS or Laravel Forge. Point the web root at `public/`, then run:

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan db:seed --force
php artisan optimize
```

In the server's `.env`, set these values:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL` (your domain)
- a strong `ADMIN_PASSWORD`

Never commit `.env`. It holds the app key and the admin password.
