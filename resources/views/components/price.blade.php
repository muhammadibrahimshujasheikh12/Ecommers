{{--
    Product price, with the struck-through "compare at" price when the
    product is on sale (compare_at_price set and higher than price).

    Props:
      product – the Product model
    Extra attributes (e.g. class) go on the wrapping <p>; "strike" sets the
    classes of the old price so the card and product page can size it apart.
--}}
@props(['product', 'strike' => 'text-ink-3'])

<p {{ $attributes }}>
    {{ rs($product->price) }}
    @if ($product->compare_at_price && $product->compare_at_price > $product->price)
        <s class="ml-2 {{ $strike }}">{{ rs($product->compare_at_price) }}</s>
    @endif
</p>
