function createSpellDescription (spellObj) {
    var $wrapper = $(document.createElement('span'))
        .addClass('description-wrapper-for-spells'),
        main = "<span class='descr-type'>//" + spellObj.type.toLowerCase() + "//</span><br /><div class='descr-heading'><br />''Casting Time:'' " + spellObj.casting_time + "<br />''Range:'' " + spellObj.range + "<br />''Classes:'' " + spellObj.classes.join(', ') + "<br />''Components:'' " + spellObj.components.raw + "<br />''Duration:'' " + spellObj.duration + " <br /></div><div class='descr-main'><br />" + spellObj.description + "<br />" + ((spellObj.hasOwnProperty('higher_levels')) ? ('<br />' + spellObj.higher_levels + '<br />') : '') + "</div>", $delete, $edit;
    //need to add edit/delete for custom spell system
    
    $wrapper.wiki(main);
    
    if (spellObj.custom) {
        
        var sv = State.variables;
        
        var $yes = $(document.createElement('button'))
            .css('float', 'left')
            .addClass('dialog-confirm')
            .attr('tabindex', '0')
            .wiki('Yes')
            .ariaClick( function () {
                // close dialog and engage loader... this could take a while
                setup.loading.show(); 
                Dialog.close();
                // find the spell instances
                var del = fast.findIndex(sv.custom, function (spell) {
                    // delete from custom list
                    return spell.name === spellObj.name;
                });
                sv.custom.deleteAt(del);
                fast.forEach(sv.lists, function (book) {
                    // comb through each spellbook
                    var deleteMe = fast.findIndex(book.spells, function (spell) {
                        return spell.name === spellObj.name;
                    });
                    if (deleteMe > -1) {
                        book.spells.deleteAt(deleteMe);
                    }
                });
                Engine.play(passage());
            });
        
        var $no = $(document.createElement('button'))
            .css('float', 'right')
            .addClass('dialog-cancel')
            .attr('tabindex', '0')
            .wiki('No')
            .ariaClick( function () {
                Dialog.close();
            });
        
        $delete = $(document.createElement('button'))
            .addClass('w100-link delete-custom spell')
            .attr('id', 'delete-button')
            .wiki('Delete.')
            .ariaClick({ label : 'Delete custom spell.' }, function () {
                Dialog.setup('Delete Custom Spell', 'delete-warning');
                Dialog.wiki('Are you sure?<br /><br />The spell will be deleted from every spellbook.<br /><br />');
                Dialog.append($yes, $no);
                Dialog.wiki('<br />');
                Dialog.open();
            });
        
        $wrapper.append($delete).wiki('<br />');
    }
    
    return $wrapper;
}

function createSpellDescriptionLink (spellObj, $el) {
    return $el
        .attr('tabindex', '0')
        .ariaClick({ label : 'View spell description.' }, function (e) {
            if ($(e.target).is('button')) {
                return;
            } else if ($(e.target).is('div.selection')) {
                $el.toggleClass('checked');
                $(document).trigger({
                    type : ':select-spell',
                    spell : spellObj,
                    $element : $el,
                    selected : $el.hasClass('checked') // add or remove from selection pool
                });
                return; // do nothing else
            }
            Dialog.setup(spellObj.name, 'spell-description');
            Dialog.append(spells.render.spellDescr(spellObj));
            Dialog.open();
        });
}

function createSpellAddLink (spellObj) {
    
    function confirmButton () {
        return $(document.createElement('button'))
            .addClass('dialog-confirm')
            .attr('tabindex', '0')
            .wiki('Confirm')
            .ariaClick( function () {
                var st = State.temporary,
                    sel = st.selected;
                if (sel === 'New book...') {
                    st.bookToEdit = false;
                    st.spellToAdd = spellObj;
                    Dialog.setup('New Spellbook', 'new-book');
                    Dialog.wiki(Story.get('Edit').text);
                    Dialog.open();
                } else {
                    var list = SpellList.getByName(sel);
                    Dialog.close();
                    var check = list.addSpell(spellObj);
                    if (check) { 
                        notify('Spell added.');
                    }
                }
            });
    }
    
    return $(document.createElement('button'))
        .addClass('spell-listing add-link')
        .attr('tabindex', '0')
        .wiki('Add')
        .ariaClick({ label : 'Add this spell to a list.' }, function () {
            Dialog.setup('Add Spell', 'add-selection');
            Dialog.wiki('Add to which list?<br /><br /><<dropdown "_selected" "New book..." $listOfLists>><br /><br />');
            Dialog.append(confirmButton());
            Dialog.open();
        });
}

function createSpellListing (spellObj, inst) {
    var $name = $(document.createElement('span'))
        .append(spellObj.name)
        .addClass('spell-listing spell-name');
    var $type = $(document.createElement('span'))
        .append(spellObj.type.toLowerCase())
        .addClass('spell-listing spell-type');
    var $classes = $(document.createElement('span'))
        .append(spellObj.classes.join(', '))
        .addClass('spell-listing spell-classes');
        
    var $select = $(document.createElement('div'))
        .addClass('selection');
    
    var $listing = $(document.createElement('div'))
        .append($name, $type, $classes, createSpellAddLink(spellObj), $select)
        .addClass('spell-listing spell-wrapper');
    
    if (inst) {
        $listing.append(inst.spellDeleteLink(spellObj));
        $('#story').attr('data-ctx', inst.name);
    } else {
        $('#story').attr('data-ctx', '');
    }
    
    createSpellDescriptionLink(spellObj, $listing);
    
    return $listing;
}

function renderListOfSpells (list, inst) {
    list = spells.get.checkList(list);
    var $wrapper = $(document.createElement('div'))
        .addClass('spell-list-containter');
    
    fast.forEach(list, function (spell, i, arr) {
        $wrapper.append(createSpellListing(spell, inst));
    });
    
    $(document).trigger(':render-list-start');
    
    return $wrapper;
}

function toElement (el) {
    return (typeof el === 'string') ? $(el) : el;
}

function wrapAndRender (sync, target, fn) {
    
    function renderMe () {
        var $target = toElement(target), 
            $content;
        
        if (typeof fn === 'function') {
            $content = fn(); // run the function
        }
        $target.empty().append($content);
        setTimeout( function () {
            setup.loading.dismiss();
            $(document).trigger(':render-list-complete');
        }, 10);
    } 
    
    if (sync) {
        renderMe();
    } else {
        postdisplay['render-content'] = function (t) {
            delete postdisplay[t];
            renderMe();
        };
    }
}

function loadNav (target, fn) {
    wrapAndRender(false, target, fn);
}

function loadNow (target, fn) {
    wrapAndRender(true, target, fn);
}

window.spells.render = {
    spellDescr : createSpellDescription,
    descrLink : createSpellDescriptionLink,
    addLink : createSpellAddLink,
    listing : createSpellListing,
    listAll : renderListOfSpells,
    load : wrapAndRender,
    loadNow : loadNow,
    loadNav : loadNav
};