// loading

var $loader = $(document.createElement('div'))
    .attr('id', 'loader')
    .append(Story.get('Loader').text)
    .appendTo('#story')
    .hide();

function showLoader () {
    $loader.show();
}

function hideLoader (time) {
    $loader.delay(30).fadeOut(time);
}

setup.loading = {
    $el : $loader,
    show : showLoader,
    dismiss : hideLoader
};

// bring up loading spinner when the list-view is being loaded
$(document).on('click', '.load-list, .load-list button', setup.loading.show);