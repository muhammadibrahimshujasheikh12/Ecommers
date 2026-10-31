{{--
    Labelled form input with its validation error.

    Props:
      name   – input name; also used as the id, the label's "for" and the @error key
      label  – visible label text (add " *" yourself for required fields)
      type   – input type, default "text"
      value  – current value (pass old('x', $default) from the caller)
      wrap   – optional classes for the wrapping <div>, e.g. "sm:col-span-2"
    Any other attribute (required, autocomplete, placeholder, autofocus…) is
    forwarded to the <input>, which always gets the shared "field" class.
--}}
@props(['name', 'label', 'type' => 'text', 'value' => null, 'wrap' => null])

<div @if ($wrap) class="{{ $wrap }}" @endif>
    <label class="label" for="{{ $name }}">{{ $label }}</label>
    <input id="{{ $name }}" name="{{ $name }}" type="{{ $type }}" value="{{ $value }}" {{ $attributes->class('field') }}>
    @error($name) <p class="error">{{ $message }}</p> @enderror
</div>
