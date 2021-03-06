/* appearance */

// mobile mode... see mobile-mode.js

function themeHandler () {
    var $html = $(document.documentElement);
    $html.removeClass('light');
    if (!settings.theme) {
        $html.addClass('light');
    }
}

function cardViewHandler () {
    var $html = $(document.documentElement);
    $html.removeClass('texture');
    if (!settings.cards) {
        $html.addClass('texture');
    }
}

function slimCaptionHandler () {
    var $html = $(document.documentElement);
    $html.removeClass('slim');
    if (settings.caption) {
        $html.addClass('slim');
    }
}

function fontInit () {
    var $html = $(document.documentElement);
    $html.removeClass('small large very-large');
    if (settings.fonts !== 'Medium') {
        $html.addClass(Util.slugify(settings.fonts));
    }
}

function fontHandler () {
    fontInit();
    if (Dialog.isOpen()) {
        Dialog.close();
        UI.settings();
    }
}

/* report bugs */
function reportModal () {
    Dialog.setup('Report Issues', 'issue-dialog');
    Dialog.wiki(Story.get('Bugs').text);
    Dialog.open();
}

/* reset */
function resetApp () {
    var $yes = $(document.createElement('button'))
        .css('float', 'left')
        .addClass('dialog-confirm')
        .attr('tabindex', '0')
        .wiki('Yes')
        .ariaClick( function () {
            Dialog.close();
            Save.autosave.delete();
            Engine.restart();
        });
    
    var $no = $(document.createElement('button'))
        .css('float', 'right')
        .addClass('dialog-cancel')
        .attr('tabindex', '0')
        .wiki('No')
        .ariaClick( function () {
            UI.settings();
        });
    
    Dialog.setup('Are you sure?', 'reset-app');
    Dialog.wiki('Resetting the app will clear all data and spellbooks.<br /><br />Continue?<br /><br />');
    Dialog.append($yes, $no);
    Dialog.open();
}

/* setting definitions */

Setting.addToggle('theme', {
    label    : 'Night mode:',
    onInit   : themeHandler,
    onChange : themeHandler
});

Setting.addToggle('cards', {
    label    : 'Flat spell cards:',
    default  : true,
    onInit   : cardViewHandler,
    onChange : cardViewHandler
});

Setting.addToggle('caption', {
    label    : 'Slim dock:',
    onInit   : slimCaptionHandler,
    onChange : slimCaptionHandler
});

Setting.addList('fonts', {
    label    : 'Font size:',
    list     : ['Small', 'Medium', 'Large', 'Very Large'],
    default  : 'Medium',
    onInit   : fontInit,
    onChange : fontHandler
});

// add buttons
Setting.addHeader('Reset App');
$(document).on(':dialogopen', function () {
    setTimeout( function () {
        var $setting = $('#header-body-reset-app');
        if ($setting.length) {
            var $report = $(document.createElement('button'))
                .wiki('Report issue.')
                .attr('id', 'bug-report-button')
                .addClass('w100-link')
                .ariaClick(reportModal);
            var $reset = $(document.createElement('button'))
                .wiki('Reset Application')
                .attr('id', 'reset-button')
                .addClass('nuke')
                .ariaClick(resetApp);
            $setting.empty().append($report).wiki('<br /><br />').append($reset);
        }
    }, Engine.minDomActionDelay);
});