/*
|--------------------------------------------------------------------------
| Variables
|--------------------------------------------------------------------------
*/
let maxBeers = 234;
let beersPerPage = 9;
let maxPages = maxBeers / beersPerPage;
let shoppingCart = [];
let tab = (window.location.pathname.indexOf('/js-online-shopping-cart/cart') === -1) ? 'home' : 'cart';
let pagination = {
    current: 1,
    first: 1,
    total: Math.round(maxBeers / beersPerPage),
    maxVisible: 5,
    sections: Math.round(( maxBeers / beersPerPage ) / 5),
    next: true,
    previous: false
};

// TODO: adding multiples of a beer to cart, when adding to cart or from cart
// TODO: add prices to the beer

// Initial setting of cart
initiateCart();

/*
|--------------------------------------------------------------------------
| AJAX
|--------------------------------------------------------------------------
*/
let baseURL = 'https://api.punkapi.com/v2/beers';

$(document).ready(function () {
    if ( tab === 'home' ) {
        displayPagination();
        getBeersByCurrentPage( 'initial' );
    } else {
        if ( shoppingCart.length > 0 ) {
            $.ajax({
                url: baseURL + '?ids=' + shoppingCart.join('|'),
                success: function(response) {
                    displayCart(response);
                    setTimeout(function () {
                        $('.progress').hide();
                        $('#cart-contents').removeClass('d-none');
                        $('#cart-container button').removeClass('d-none');
                    }, 2000);
                },
                error: function(xhr, status, error) {
                    $('#error-modal').modal();
                },
                complete: function () {
                }
            });
        } else {
            setTimeout(function () {
                $('.progress').hide();
                $('#empty-cart').removeClass('d-none');
            }, 1000);
        }
    }
});

/**
 * Make API call to get beers by the current page.
 *
 * @param type string Specifies if this is being called for the first time, or via the pagination.
 */
function getBeersByCurrentPage( type ) {
    $.ajax({
        url: baseURL + '?page=' + pagination.current + '&per_page=' + beersPerPage,
        success: function(response) {
            displayBeers(response);

            setTimeout(function () {
                $('.progress').hide();
                $('#beer-listings').removeClass('d-none');
                $('#beer-pagination').removeClass('d-none');
            }, 2000);
        },
        error: function(xhr, status, error) {
            $('#error-modal').modal();
        },
        complete: function () {
            if ( type === 'pagination' ) {
                setTimeout(function () {
                    // Remove disabled styling
                    $('.page-item').removeClass('disabled');
                    updatePreviousAndNext();
                }, 2000);
            }
        }
    });
}

/*
|--------------------------------------------------------------------------
| Event Listeners
|--------------------------------------------------------------------------
*/
// Adds or removes beer from shopping cart
$(document).on('click', '.cart-toggle', function () {
    updateCart( $(this)[0].dataset.cartStatus, $(this).val() );
    setCookie( 'shoppingCart', shoppingCart.join(','), 'generic' );
    updateCartButtons( $(this).val() );
});

// Removes beer from shopping cart, on the shopping cart page
$(document).on('click', '.cart-remove', function () {
    updateCart( $(this)[0].dataset.cartStatus, $(this).val() );
    setCookie( 'shoppingCart', shoppingCart.join(','), 'generic' );
    removeFromCartDisplay( $(this).val() );
});

// When the checkout button in the shopping cart is clicked
$('#cart-container button').on('click', function () {
    $('#cart-container').fadeOut();
    $('#cart-checkout').removeClass('d-none').fadeIn();
});

// Pagination change
$(document).on('click', '.page-link', function () {
    $('.page-item').addClass('disabled');
    $('#beer-listings').addClass('d-none');
    $('#beer-container .progress').show();

    updatePagination( this );
    getBeersByCurrentPage( 'pagination' );
});

// Checkout form submission
$('#cart-checkout form').on('submit', function () {
    $(this).hide();
    $('#checkout-result').removeClass('d-none');
    document.cookie = "shoppingCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/
/**
 * Displays all the beers currently returned from the API.
 *
 * @param {array} beers - Array of beer objects.
 */
function displayBeers(beers) {
    var html = '', count = 0, status, text, btnClass;

    html += '<div class="card-columns">';

    for (var i = 0; i < beers.length; i++) {
        if ( shoppingCart.indexOf(beers[i].id.toString()) === -1 ) {
            status = 'add';
            text = 'Add to Cart';
            btnClass = 'btn-primary';
        } else {
            status = 'remove';
            text = 'Remove from Cart';
            btnClass = 'btn-danger';
        }

        // Display columns of beer
        html += '<div class="card text-center">';
        html += '<img class="card-img-top mx-auto mt-3" src="' + beers[i].image_url + '" alt="Card image cap" style="width: 50px;">';
        html += '<div class="card-body">';
        html += '<h5 class="card-title">' + beers[i].name + '</h5>';
        html += '<p class="card-text text-left">' + beers[i].description + '' + '</p>';
        html += '<p class="text-left mb-0"><button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#beer-' + beers[i].id + '">More Info</button>&nbsp;' +
            '<button type="button" class="btn ' + btnClass + ' cart-toggle" data-cart-status="' + status + '" value="' + beers[i].id + '">' + text + '</button></p>';
        html += '</div>';
        html += '</div>';

        // Increment or output HTML
        if (count < 2) {
            count++;
        } else {
            count = 0;
            $('#beer-listings').html(html);
        }

        html += outputModals( beers[i], status, text, btnClass );
    }
    html += '</div>';
}

/**
 * Outputs the modal HTML for each beer in the API.
 *
 * @param {object} beer - A beer in object form returned from the API.
 * @param {string} status - The current action for the beer (add to / remove from cart)
 * @param {string} text - Button text for the action to take on the beer (add to / remove from cart)
 * @param {string} btnClass - The class name to be used for the action to take button.
 * @returns {string} The HTML for the details modal.
 */
function outputModals(beer, status, text, btnClass) {
    return '<div class="modal fade" tabindex="-1" role="dialog" id="beer-' + beer.id + '">\n' +
        '  <div class="modal-dialog modal-lg" role="document">\n' +
        '    <div class="modal-content">\n' +
        '      <div class="modal-header">\n' +
        '        <h5 class="modal-title">' + beer.name + ' - <small>' + beer.tagline + '</small></h5>' +
        '        <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
        '          <span aria-hidden="true">&times;</span>\n' +
        '        </button>\n' +
        '      </div>\n' +
        '      <div class="modal-body">\n' +
        '        <p>' + beer.description + '</p>\n' + displayBeerDetails(beer) +
        '      </div>\n' +
        '      <div class="modal-footer">\n' +
        '        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>\n' +
        '        <button type="button" class="btn ' + btnClass + ' cart-toggle" data-cart-status="' + status + '" value="' + beer.id + '">' + text + '</button>\n' +
        '      </div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</div>';
}

/**
 * Displays the details for a beer.
 *
 * @param {object} beer - A beer in object form returned from the API.
 * @returns {string} The HTML to be added.
 */
function displayBeerDetails(beer) {
    var pairing = '<ul class="list-unstyled">';
    for ( var i = 0; i < beer.food_pairing.length; i++ ) {
        pairing += '<li>' + beer.food_pairing[i] + '</li>';
    }
    pairing += '</ul>';

    return '<dl class="row">' +
        '<dt class="col-sm-3">Alcohol by Volume</dt>\n' +
        '          <dd class="col-sm-9">' + beer.abv + '</dd>\n' +
        '          <dt class="col-sm-3">IBU</dt>\n' +
        '          <dd class="col-sm-9">' + beer.ibu + '</dd>\n' +
        '          <dt class="col-sm-3">Food Pairing</dt>\n' +
        '          <dd class="col-sm-9">' + pairing + '</dd>\n' +
        '          <dt class="col-sm-3">Brewer\'s Tips</dt>\n' +
        '          <dd class="col-sm-9">' + beer.brewers_tips + '</dd>\n' +
        '        </dl>';
}

/**
 * Displays the correct pagination depending on the max number of pages.
 */
function displayPagination() {
    var html = '', className = '';

    if ( pagination.total === 1) {
        html += '<li class="page-item disabled active" data-pagination-value="1"><a class="page-link" href="javascript:void(0);">1</a></li>';
    } else if ( pagination.total <= 5 ) {
        html += '<li class="page-item disabled" data-pagination-value="previous"><a class="page-link" href="javascript:void(0);" tabindex="-1">Previous</a></li>';
        for ( var i = 1; i <= pagination.total; i++ ) {
            className = determinePageItemClasses( i, pagination.total );
            html += '<li class="page-item' + className + '" data-pagination-value="' + i + '"><a class="page-link" href="javascript:void(0);">' + i + '</a></li>';
        }
        html += '<li class="page-item" data-pagination-value="previous"><a class="page-link" href="javascript:void(0);">Next</a></li>';
    } else {
        html += '<li class="page-item disabled" data-pagination-value="previous"><a class="page-link" href="javascript:void(0);" tabindex="-1">Previous</a></li>';
        for ( var i = 1; i <= pagination.maxVisible; i++ ) {
            className = determinePageItemClasses( i, pagination.maxVisible );
            html += '<li class="page-item' + className + '" data-pagination-value="' + i + '"><a class="page-link" href="javascript:void(0);">' + i + '</a></li>';
        }
        html += '<li class="page-item" data-pagination-value="next"><a class="page-link" href="javascript:void(0);">Next</a></li>';
    }

    $('.pagination').html( html );
}

/**
 * Initializes the shopping cart.
 */
function initiateCart() {
    let cookie = getCookie('shoppingCart');
    if ( cookie === '' ) {
        setCookie( 'shoppingCart', shoppingCart.join(','), 'initial' );
    } else {
        shoppingCart = cookie.split(',');
    }

    // Update nav badge
    $('#cart-count').text( shoppingCart.length );
}

/**
 * Updates cart buttons for this beer.
 *
 * @param {string} value - The ID of beer.
 */
function updateCartButtons( value ) {
    $('.cart-toggle[value="' + value + '"]').each(function () {
        if ( $(this)[0].dataset.cartStatus === 'add' ) {
            $(this).text('Remove from Cart');
            $(this)[0].dataset.cartStatus = 'remove';
            $(this).removeClass('btn-primary').addClass('btn-danger');
        } else {
            $(this).text('Add to Cart');
            $(this)[0].dataset.cartStatus = 'add';
            $(this).removeClass('btn-danger').addClass('btn-primary');
        }
    });
}

/**
 * Add a beer to, or remove a beer from the shopping cart.
 *
 * @param {string} type - The action for the beer.
 * @param {array} beer - The ID of the beer.
 */
function updateCart( type, beer ) {
    if ( type === 'add' ) {
        shoppingCart.push(beer);
    } else {
        shoppingCart.splice(shoppingCart.indexOf(beer), 1);
    }

    // Update nav badge
    $('#cart-count').text( shoppingCart.length );
}

/**
 * Get a cookie value by cookie name.
 *
 * @param {string} name - The name of the cookie to search for.
 * @returns {string} The cookie value (if exists)
 */
function getCookie(name) {
    if ( document.cookie.length > 0 ) {
        var allCookies = document.cookie.split('; ');
        for ( var i = 0; i < allCookies.length; i++ ) {
            if ( allCookies[i].split('=')[0] === name ) {
                return allCookies[i].split('=')[1];
            }
        }
    }
    return '';
}

/**
 * Set a cookie
 *
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {string} type - The occasion when the cookie is being set.
 */
function setCookie( name, value, type ) {
    if ( type === 'initial' ) {
        var d = new Date();
        d.setHours( d.getHours() + 1 );
        document.cookie = name + '=' + value + '; expires=' + d.toString() + '; path=/';
    } else {
        document.cookie = name + '=' + value + '; path=/';
    }
}

/**
 * Displays the shopping cart.
 *
 * @param {array} beers - The beers currently in the shopping cart.
 */
function displayCart(beers) {
    var html = '';
    for ( var i = 0; i < beers.length; i++ ) {
        html += '<div class="row border-bottom mb-2 p-2" id="cart-beer-' + beers[i].id + '">';
        html += '<div class="col-sm-3">';
        html += '<img src="' + beers[i].image_url + '" class="mx-auto d-block" alt="..." style="width: 30px;">';
        html += '</div>';

        html += '<div class="col-sm-9">';
        html += '<p class="lead">' + beers[i].name + ' - <small>' + beers[i].tagline + '</small></p>';
        html += '<p><button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#cart-details-' + beers[i].id + '" aria-expanded="false" aria-controls="collapseExample">\n' +
            '    Details\n' +
            '  </button>' +
            '&nbsp;<button type="button" class="btn btn-danger cart-remove" data-cart-status="remove" value="' + beers[i].id + '">Remove from Cart</button></p>';
        html += '<div class="collapse" id="cart-details-' + beers[i].id + '">\n' +
            '  <div class="card card-body">' + displayBeerDetails(beers[i]) + '</div></div>';
        html += '</div>';
        html += '</div>';
    }
    $('#cart-contents').html(html);
}

/**
 * Removes an item from the shopping cart.
 *
 * @param {string} id - The ID of the beer to remove.
 */
function removeFromCartDisplay( id ) {
    $("#cart-beer-" + id).fadeOut();
}

/**
 * Updates the pagination by moving the selected page.
 *
 * @param {HTMLElement} btn - The button that was selected via pagination.
 */
function updatePagination( btn ) {
    var val = $(btn).parent()[0].dataset.paginationValue;

    if ( val === 'previous' ) {
        pagination.current--;
        if ( pagination.current === 1 ) {
            pagination.previous = false;
        } else {
            pagination.previous = true;
            pagination.next = true;
        }

        if ( $('.pagination .active').hasClass('left-index') ) {
            replacePagination(val);
        }
        $('.pagination .active').removeClass('active');
    } else if ( val === 'next' ) {
        pagination.current++;
        if ( pagination.current === pagination.total ) {
            pagination.next = false;
        } else {
            pagination.previous = true;
            pagination.next = true;
        }

        if ( $('.pagination .active').hasClass('right-index') ) {
            replacePagination(val);
        }
        $('.pagination .active').removeClass('active');
    } else {
        $('.pagination .active').removeClass('active');
        pagination.current = parseInt(val);
        if ( pagination.current !== 1 ) {
            pagination.previous = true;
        } else if ( pagination.current === pagination.total ) {
            pagination.next = false;
        } else {
            pagination.previous = true;
            pagination.next = true;
        }
    }

    // Update the active page
    $('.page-item[data-pagination-value="' + pagination.current + '"]').addClass('active');
}

/**
 * Replaces the pagination HTML with the next set of pages.
 *
 * @param {string} type - Specifies in which direction the pagination should be updated (higher or lower).
 */
function replacePagination( type ) {
    var curr = pagination.current;
    var temp = curr;
    var visible = (type === 'next') ? 0 : pagination.maxVisible;
    var html = '', className = '';

    html += '<li class="page-item" data-pagination-value="previous"><a class="page-link" href="javascript:void(0);" tabindex="-1">Previous</a></li>';

    if ( type === 'next' ) {
        while( temp <= pagination.total && visible < pagination.maxVisible ) {
            if ( visible === 0 ) {
                className = ' active left-index'
            } else if ( visible + 1 === pagination.maxVisible ) {
                className = ' right-index'
            } else {
                className = '';
            }

            html += '<li class="page-item' + className + '" data-pagination-value="' + temp + '"><a class="page-link" href="javascript:void(0);">' + temp + '</a></li>';
            visible++;
            temp++;
        }
    } else {
        var array = [];
        while ( temp >= 1 && visible > 0 ) {
            if ( visible === pagination.maxVisible ) {
                className = ' active right-index'
            } else if ( visible === 1 ) {
                className = ' left-index'
            } else {
                className = '';
            }
            array.push('<li class="page-item' + className + '" data-pagination-value="' + temp + '"><a class="page-link" href="javascript:void(0);">' + temp + '</a></li>');
            visible--;
            temp--;
        }

        for ( var i = array.length - 1; i >= 0; i-- ) {
            html += array[i];
        }
    }

    html += '<li class="page-item" data-pagination-value="next"><a class="page-link" href="javascript:void(0);">Next</a></li>';

    $('.pagination').html(html);
}

/**
 * Determine the additional classes to add to the page-item class for the pagination.
 *
 * @param {number} i - The current index for the pagination.
 * @param {number} max - The max amount of page numbers to show.
 * @returns {string} The class name to be added to the page-item.
 */
function determinePageItemClasses( i, max ) {
    if ( i === 1 ) {
        return ' active left-index';
    } else if ( i === max ) {
        return ' right-index'
    } else {
        return '';
    }
}

/**
 * Disable previous/next buttons if need be.
 */
function updatePreviousAndNext() {
    if ( pagination.previous === false ) {
        $('.page-item[data-pagination-value="previous"]').addClass('disabled');
    }
    if ( pagination.next === false ) {
        $('.page-item[data-pagination-value="next"]').addClass('disabled');
    }
}