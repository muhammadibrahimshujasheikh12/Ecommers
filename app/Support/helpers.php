<?php

/*
 * Global helpers, autoloaded through composer.json "files".
 */

if (! function_exists('rs')) {
    /** Format a whole-rupee PKR amount for display, e.g. rs(1500) => "Rs. 1,500". */
    function rs(int|float|null $amount): string
    {
        return 'Rs. '.number_format((float) $amount);
    }
}
