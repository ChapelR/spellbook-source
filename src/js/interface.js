// interface.js: ui controls, among other things


/*    CAPTION API    */


/* caption interface */
setup.caption = {
    
    $el : $('#caption'),
    
    $title : $('#caption-text'),
    
    $main : $('#caption-link'),
    
    open : function () {
        setup.caption.$el.addClass('open');
    },
    
    close : function () {
        setup.caption.$el.removeClass('open');
    },
    
    toggle : function () {
        setup.caption.$el.toggleClass('open');
    },
    
    setTitle : function (str) {
        if (!str || typeof str !== 'string') {
            str = 'menu';
        }
        setup.caption.$title.empty().wiki(str);
    },
    
    setContent : function (str) {
        if (!str || typeof str !== 'string') {
            str = 'return';
        }
        setup.caption.$main.empty().wiki(str);
    },
    
    stripClasses : function ( /* class list */ ) {
        // cache the 'open' class
        var openClass = setup.caption.$el.hasClass('open');
        setup.caption.$el.removeClass();
        if (openClass) {
            setup.caption.$el.addClass('open');
        }
    },
    
    setClasses : function ( /* class list */ ) {
        // pull classes from args
        var classes = [].slice.call(arguments);
        classes = classes.flatten().join(' ');
        // do the thing
        setup.caption.stripClasses();
        setup.caption.$el.addClass(classes);
    },
    
    opts : function (title, main, classes) {
        if (classes) {
            classes = [].slice.call(arguments);
            classes = classes.slice(2).flatten();
            setup.caption.setClasses(classes);
        }
        setup.caption.setContent(main);
        setup.caption.setTitle(title);
    }
};

/* handle tag-based captions */
function captionSetup (tag, title, content) {
    if (tags().includes(tag)) {
        setup.caption.opts(title, content, tag);
        setup.caption.open();
    }
}
postdisplay['caption-link'] = function (t) {
    setup.caption.close();
    captionSetup('search', 'search', 'Return');
    captionSetup('spells', 'books', 'create');
    captionSetup('list-view', 'list', 'filter');
    captionSetup('custom-view', 'custom', 'create');
};

function whatCaption (cls) {
    return (setup.caption.$el.hasClass(cls));
}

function description () {
    if (whatCaption('spells')) {
        return 'Create a new spellbook.';
    } 
    if (whatCaption('list-view')) {
        return 'Filter results.';
    } 
    if (whatCaption('custom-view')) {
        return 'Create a custom spell.';
    } 
    return 'More options.';
}

/* caption listener */
postdisplay['set-caption'] = function () {
    $('#caption').off().ariaClick({ label : description() } ,function (e) {
        
        // menu handler
        if (whatCaption('search')) {
            Engine.play('Start');
        } else if (whatCaption('spells')) {
            State.temporary.bookToEdit = false;
            State.temporary.spellToAdd = false;
            Dialog.setup('New Spellbook', 'new-book');
            Dialog.wiki(Story.get('Edit').text);
            Dialog.open();
        } else if (whatCaption('list-view')) {
            Dialog.setup('Filter', 'list-view-filter');
            Dialog.wiki(Story.get('Filter').text);
            Dialog.open();
            $('#search').val('Search...');
        } else if (whatCaption('custom-view')) {
            State.temporary.customEdit = null;
            setup.custom.dialog(true);
            $('#search').val('Search...');
        }
    });
};

/*    KEYBOARD CONTROLS    */


$(document).on('keyup', function (e) {
    if (e.which == 27 || e.which == 81) { // esc or Q
        if (Dialog.isOpen()) {
            // dialog window
            $('#ui-dialog-close').trigger('click');
        } else if (setup.caption.$el.hasClass('open')) {
            // caption-based controls
            setup.caption.$el.trigger('click');
        } else {
            // widget-based return links
            $('#return-link a').trigger('click');
            $('#return-link button').trigger('click');
        }
    } else if (e.which == 32 || e.which == 17) { // space bar / ctrl 
        if ($('#main-talk-action').length) {
            $('#main-talk-action').trigger('click');
        } else {
            $('#space-link button, #space-link a').trigger('click');
        }
    } else if (e.which == 13) { // enter
        $('#enter-link button, #enter-link a').focus().trigger('click');
    }
});


/*    MISC FUNCTIONS    */


/*    USER INTERFACE    */


/* menu bar */
$('#ui-restart').ariaClick({ label : 'Restart the app.' }, function () {
    UI.restart();
});
$('#ui-data').ariaClick({ label : 'Import and export spellbooks.' }, function () {
    Dialog.setup('Share', 'share-spellbooks');
    Dialog.wiki(Story.get('Share').text);
    Dialog.open();
});
$('#ui-settings').ariaClick({ label : 'Settings.' }, function () {
    UI.settings();
});
$('#ui-about').ariaClick({ label : 'About.' }, function () {
    Dialog.setup('About', 'about-dialog');
    Dialog.wiki( Story.get('About').text );
    Dialog.open();
});
$('#ui-custom').ariaClick({ label : 'Custom spells.' }, function () {
    $('#story').attr('data-ctx', '');
    Engine.play('Custom');
});
$('#ui-lists').ariaClick({ label : 'Your spellbooks.' }, function () {
    Engine.play('Lists');
});
$('#ui-all').ariaClick({ label : 'All spells.' }, function () {
    $('#story').attr('data-ctx', '');
    setup.results = spells.list;
    State.variables.listName = 'All Spells';
    Engine.play('Results');
});

/* bottom bar */
var $search = $(document.createElement('input'))
    .attr({
        'id' : 'search',
        'type' : 'text',
        'value' : 'Search...'
    })
    .addClass('list-view-terms')
    .on('focus', function () {
        var $el = $(this);
        if (!$el.val() || $el.val() === 'Search...') {
            $el.val('');
        }
    })
    .on('blur', function () {
        var $el = $(this);
        if (!$el.val()) {
            $el.val('Search...');
        }
    })
    .on('input', function () {
        var term = $(this).val(),
            st = State.temporary,
            sv = State.variables,
            inst, mainList, list;
        
        if (sv.ctx) {
            inst = SpellList.getByName(sv.ctx);
            mainList = inst.spells;
        } else {
            inst = null;
            mainList = setup.results;
        }
        
        list = (st.filtered) ? st.filtered : mainList;
        
        if (!st.termFiltered) { // update cache when external filters change
            st.cache = clone(list);
            st.termFiltered = true;
        } 
        
        // always search from the cache
        var result = spells.get.byName(term, st.cache);
        st.filtered = result;
        
        // reset selected spells
        st.selectedSpells = [];
        $(document).trigger(':select-spell');
        
        if (result.length > 0) {
            if (inst && sv.ctx) {
                $('#results').empty().append(spells.render.listAll(result, inst));
            } else {
                $('#results').empty().append(spells.render.listAll(result));
            }
        } else {
            $('#results').empty().wiki('No spells match the criteria.');
        }
    });

$('#bottom-bar').append($search).hide();

/* side options */

var $addAll = $(document.createElement('button')) 
    .attr('id', 'add-all')
    .addClass('closed')
    .wiki('Add all.')
    .ariaClick({ label : 'Add all the selected spells to a list.' }, function () {
        var st = State.temporary,
            sv = State.variables,
            inst, mainList, list,
            spellsToAdd;
        if (sv.ctx) {
            inst = SpellList.getByName(sv.ctx);
            mainList = inst.spells;
        } else {
            inst = null;
            mainList = setup.results;
        }
        if (st.selectedSpells && Array.isArray(st.selectedSpells) && st.selectedSpells.length > 0) {
            spellsToAdd = st.selectedSpells;
        } else {
            spellsToAdd = (st.filtered && Array.isArray(st.filtered)) ? st.filtered : mainList;
        }
        
        st.listsToShow = fast.filter(sv.listOfLists, function (listName) {
            return listName !== sv.ctx;
        });
        
        function addAllConfirm () {
            return $(document.createElement('button'))
                .addClass('dialog-confirm')
                .attr('tabindex', '0')
                .wiki('Confirm')
                .ariaClick( function () {
                    var st = State.temporary,
                        sel = st.selected;
                    if (sel === 'New book...') {
                        st.bookToEdit = false;
                        st.spellToAdd = spellsToAdd;
                        Dialog.setup('New Spellbook', 'new-book');
                        Dialog.wiki(Story.get('Edit').text);
                        Dialog.open();
                    } else {
                        var list = SpellList.getByName(sel);
                        Dialog.close();
                        fast.forEach(spellsToAdd, function (spellObj) {
                            list.addSpell(spellObj, true);
                        });
                    }
                    notify('Spell(s) added.');
            });
        }
        
        if (spellsToAdd.length > 0) {
            Dialog.setup('Add Spells', 'add-selection');
            Dialog.wiki('Add all of these spells to which list?<br /><br /><<dropdown "_selected" "New book..." _listsToShow>><br /><br />');
            Dialog.append(addAllConfirm());
            Dialog.open();
        } else {
            notify('No spells...');
        }
    })
    .appendTo('#story');

var $removeAll = $(document.createElement('button')) 
    .attr('id', 'remove-all')
    .addClass('closed')
    .wiki('Remove all.')
    .ariaClick({ label : 'Remove all the selected spells from this list.' }, function () {
        var st = State.temporary,
            sv = State.variables,
            inst, mainList,
            spellsToRemove;
        if (sv.ctx) {
            inst = SpellList.getByName(sv.ctx);
            mainList = inst.spells;
        } else {
            inst = null;
            mainList = setup.results;
        }
        
        if (st.selectedSpells && Array.isArray(st.selectedSpells) && st.selectedSpells.length > 0) {
            spellsToRemove = st.selectedSpells;
        } else {
            spellsToRemove = (st.filtered && Array.isArray(st.filtered)) ? st.filtered : mainList;
        }
        
        function removeAllConfirm () {
            return $(document.createElement('button'))
                .addClass('dialog-confirm')
                .attr('tabindex', '0')
                .wiki('Confirm')
                .ariaClick( function () {
                    if (spellsToRemove.length === 1) {
                        inst.deleteSpell(spellsToRemove[0]);
                    } else {
                        var deleteList = fast.map(spellsToRemove, function (spellObj) {
                            return spellObj.name;
                        });
                        inst.deleteMany(deleteList);
                    }
                    Dialog.close();
                    notify('Spell(s) removed.');
                    Engine.play(passage());
            });
        }
        
        if (spellsToRemove.length > 0) {
            Dialog.setup('Remove Spells', 'remove-selection');
            Dialog.wiki('Remove all of these spells from the list?<br /><br />');
            Dialog.append(removeAllConfirm());
            Dialog.open();
        } else {
            notify('No spells...');
        }
    })
    .appendTo('#story');

function hideControls () {
    $addAll.addClass('closed');
    $removeAll.addClass('closed');
}

function showControls () {
    hideControls();
    $addAll.removeClass('closed');
    $addAll.empty().wiki('Add all.');
    if (State.variables.ctx) {
        $removeAll.removeClass('closed');
        $removeAll.empty().wiki('Remove all.');
    }
}

// todo: add remove all / remove selected

/* checked system */
$(document).on(':select-spell', function (e) {
    var pool = State.temporary.selectedSpells || [], 
        del;
    if (e.selected) {
        pool.push(e.spell);
    } else {
        del = fast.findIndex(pool, function (spell) {
            return e.spell.name === spell.name;
        });
        pool.deleteAt(del);
    }
    // update add all / remove all to add selected / remove selected
    if (pool.length < 1) {
        // add all and remove all
        $addAll.empty().wiki('Add all.');
        $removeAll.empty().wiki('Remove all.');
    } else {
        // add selected and remove selected
        $addAll.empty().wiki('Add selected.');
        $removeAll.empty().wiki('Remove selected.');
    }
    State.temporary.selectedSpells = pool;
});

postdisplay['show-goodies'] = function (t) {
    if (tags().includes('list-view') || tags().includes('custom-view')) {
        $('#bottom-bar').show();
        $('#search').val('Search...'); // reset search term on load
        showControls();
    } else {
        $('#bottom-bar').hide();
        hideControls();
    }
};

// soft reset
$(document).on('keyup', function (e) {
    if (e.shiftKey && e.ctrlKey && e.which == 88) { // ctrl + shift + x 
        Engine.restart(); // restart
    }
    if (e.shiftKey && e.ctrlKey && e.which == 90) { // ctrl + shift + z 
        Engine.play('Start'); // go to landing page
    }
    if (e.shiftKey && e.ctrlKey && e.which == 13) { // ctrl + shift + enter 
        var sv = State.variables;
        sv.loader = !sv.loader;
        if (sv.loader) {
            LoadScreen.show();
        } else {
            LoadScreen.hide();
        }
    }
    if (e.shiftKey && e.ctrlKey && e.which == 32) { // ctrl + shift + space 
        Dialog.setup('Report Issues', 'issue-dialog');
        Dialog.wiki(Story.get('Bugs').text);
        Dialog.open();
    }
});