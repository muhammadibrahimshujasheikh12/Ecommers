<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Order confirmation email sent to the customer (and BCC'd to the shop)
 * when an order is placed. The view shows bank details for Bank Transfer orders.
 */
class OrderPlaced extends Mailable
{
    use Queueable, SerializesModels;

    /** @param  Order  $order  the order just placed; exposed to the view as $order */
    public function __construct(public Order $order) {}

    /** Subject line includes the order number. */
    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your Closet Stories order {$this->order->order_number}");
    }

    /** Rendered from resources/views/emails/order-placed.blade.php. */
    public function content(): Content
    {
        return new Content(view: 'emails.order-placed');
    }
}
