var dir = 'assets/images/',
    $preloader = $(document.createElement('div')),
    sourceList = [ 
        'about.svg',
        'all.svg',
        'changelog.svg',
        'checked.svg',
        'custom.svg',
        'data.svg',
        'edit.svg',
        'lists.svg',
        'restart.svg',
        'settings.svg',
        'unchecked.svg'
    ];

sourceList = fast.map(sourceList, function (src) { return dir + src });

$preloader
    .attr('id', 'imgloader-box')
    .appendTo(document.body);

function preload (sources) {
    if (sources && Array.isArray(sources) && sources.length) {
        sources.forEach( function (src) {
            var $image = $(document.createElement('img'));
            $image
                .attr('src', src)
                .appendTo($preloader);
        });
    }
}

function clearPreloadBox (sources) {
    $preloader.empty();
}

setup.preloader = {
    // for external use:
    $el   : $preloader,
    load  : preload,
    clear : clearPreloadBox,
    imgs  : sourceList
};

(function () { // ensure images are ready before playing
    var ID = LoadScreen.lock()
    preload(sourceList);
    LoadScreen.unlock(ID);
}());