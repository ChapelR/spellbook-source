State.variables.lists = [];
State.variables.listOfLists = [];

window.SpellList = function (name, tags, spellArray, accessed) {
    if (this instanceof SpellList) {
        this.name = name; // the *unique* name of the spellbook, used for display and for identifying the book internally
        this.tags = tags || []; // along with name, tags will probably eventually be searchable in the book-view
        this.spells = spellArray || []; // the main attraction
        this.access = accessed || Date.now(); // auto-assign except when cloned or deserialized
    } else {
        // add new if this constructor was called without it
        return new SpellList(name, tags, spellArray);
    }
};

SpellList.is = function (inst) {
    // check is passed instance is spell list, and check for taken list names
    return inst instanceof SpellList;
};

SpellList.add = function (name, tags, spells) {
    var sv = State.variables;
    fast.push(sv.lists, new SpellList(name, tags, spells));
    fast.push(sv.listOfLists, name);
    $(document).trigger(':new-book');
    return sv.lists[sv.lists.length - 1]; // return the spellbook
};

SpellList.getByName = function (name, includeIndex) {
    var sv = State.variables, ret,
        inst = fast.find(sv.lists, function (entry) {
            return (entry.name === name);
        });
    if (includeIndex) {
        var idx = fast.findIndex(sv.lists, function (entry) {
            return (entry.name === name);
        });
        ret = [inst, idx];
    } else {
        ret = inst;
    }
    return ret;
};

SpellList.isAccessed = function (name) {
    var inst = SpellList.getByName(name);
    if (inst && SpellList.is(inst)) {
        inst.access = Date.now();
    }
};

SpellList.sortByAccess = function () {
    var sv = State.variables;
    
    function compare (a, b) {
        if (a.access < b.access) {
            return 1;
        }
        if (a.access > b.access) {
            return -1;
        }
        return 0;
    }
    
    sv.lists.sort(compare);
};

SpellList.search = function (term, list) {
    // search by name and tags
    var sv = State.variables;
    term = setup.get.cleanText(term);
    if (!list || !Array.isArray(list) || list.length < 1 || !SpellList.is(list[0])) {
        list = State.variables.lists;
    }
    return setup.get.sortList(fast.filter(list, function (list) {
        var check = list.name + list.tags.join(' ');
        return check.includesAny(term.split(' '));
    }));
};

SpellList.del = function (name) {
    var sv = State.variables,
        del = SpellList.getByName(name, true)[1];
    
    sv.lists.deleteAt(del);
    
    del = fast.indexOf(sv.listOfLists, name);
    
    sv.listOfLists.deleteAt(del);
};

SpellList.listify = function (list) {
    // render all spell book cards in a filtered or non-filtered list
    if (!list || !Array.isArray(list) || list.length < 1 || !SpellList.is(list[0])) {
        list = State.variables.lists;
    }
    var $wrapper = $((document).createElement('span'))
        .addClass('book-wrapper');
    
    fast.forEach(list, function (book) {
        $wrapper.append(book.listing());
    });
    
    return $wrapper;
};

SpellList.render = function (el, list) {
    spells.render.load(false, el, function () {
        return SpellList.listify(list);
    });
};

SpellList.update = function (el, list) {
    spells.render.load(true, el, function () {
        // for when search is added
        return SpellList.listify(list);
    });
};

SpellList.importList = function (enc) {
    // to get it into your app
    return setup.share.importFromString(enc);
};

SpellList.prototype = {
    
    listing : function () {
        var inst = this;
        
        var displayName = inst.name, 
            displayTags = inst.tags.join(' ');
        if (displayTags.length < 1) {
            displayTags = ' [no tags] ';
        }
        
        var $name = $(document.createElement('div'))
            .addClass('book-listing card-name')
            .append(displayName); // to ensure no markup
        
        var $tags = $(document.createElement('div'))
            .addClass('book-listing card-tags')
            .append(displayTags);
            
        var $edit = $(document.createElement('div'))
            .addClass('book-listing card-edit-btn')
            .attr('data-book', inst.name)
            .wiki('[EDIT]')
            .ariaClick({ label : 'Change spell book information.' }, function () {
                State.temporary.bookToEdit = inst.name;
                State.temporary.spellToAdd = false;
                Dialog.setup('Edit Spellbook', 'edit-book');
                Dialog.wiki(Story.get('Edit').text);
                Dialog.open();
            });
        
         var $card = $(document.createElement('div'))
            .addClass('book-listing card')
            .attr('data-book', inst.name)
            .append($name, $tags, $edit)
            .ariaClick({ label : 'View spell book.' }, function (e) {
                if ($(e.target).hasClass('card-edit-btn')) {
                    return;
                }
                setup.loading.show();
                $(document).trigger({
                    type : ':access-book',
                    inst : inst
                });
                State.variables.ctx = inst.name;
                State.variables.listName = 'Spell Book: ' + inst.name;
                Engine.play('BookList');
            });
        
        return $card;
    },
    
    rename : function (newName, newTags) {
        // rename a list
        var sv = State.variables,
            i = fast.indexOf(sv.listOfLists, this.name);
        
        sv.listOfLists[i] = newName;
        this.name = newName;
        this.tags = newTags;
    },
    
    hasSpell : function (spellObj) {
        // bug: only works once!!!
        var ret = false;
        var list = clone(this.spells);
        fast.forEach(list, function (obj) {
            if (spellObj.name === obj.name) {
                ret = true;
            }
        });
        return ret;
    },
    
    addSpell : function (spellObj, suppressError) {       
        if (this.hasSpell(spellObj)) {
            if (!suppressError) {
                UI.alert('<strong>' + spellObj.name + '</strong> is already in the [' + this.name + '] spell book.');
            }
            return false;
        }
        fast.push(this.spells, spellObj);
        $(document).trigger({
            type : ':access-book',
            inst : this
        });
        return true;
    },
    
    deleteSpell : function (i /* index or object */) {
        if (typeof i === 'number' && Number.isInteger(i)) {
            this.spells.deleteAt(i);
            notify('Spell removed.');
            return this;
        }
        if (typeof i === 'object') {
            var del = fast.findIndex(this.spells, function (entry) {
                return (i.name === entry.name);
            });
            this.spells.deleteAt(del);
            notify('Spell removed.');
            return this;
        }
        console.warn('Spell "' + i + '" could not be deleted by <spelllist>.deleteSpell().');
        return this;
    },
    
    deleteMany : function () {
        var args = [].slice.call(arguments);
        args = args.flatten();
            
        var keep = fast.filter(this.spells, function (spellObj) {
            return !args.includes(spellObj.name);
        });
        notify('Spell(s) removed.');
        this.spells = keep;
        
        return this;
    },
    
    updateAccess : function () {
        this.access = Date.now();
    },
    
    spellDescriptionLink : function (idx, el) {
        // a SugarCube Dialog link for spells (an array of links)
        return spells.render.descrLink(this.spells[idx], el);
    },
    
    spellDeleteLink : function (idx) {
        // a link for deleting spells from the list (an array of links)
        var inst = this;
        
        var $yes = $(document.createElement('button'))
            .css('float', 'left')
            .addClass('dialog-confirm')
            .attr('tabindex', '0')
            .wiki('Yes')
            .ariaClick( function () {
                inst.deleteSpell(idx);
                Dialog.close();
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
        
        return $(document.createElement('button'))
            .addClass('spell-listing delete-link')
            .attr('tabindex', '0')
            .wiki('Remove')
            .ariaClick({ label : 'Remove this spell from the list.' }, function () {
                Dialog.setup('Delete Spell', 'delete-warning');
                Dialog.wiki('Are you sure?<br /><br />');
                Dialog.append($yes, $no);
                Dialog.wiki('<br />');
                Dialog.open();
            });
    },
    
    spellListing : function (idx) {
        return spells.render.listing(this.spells[idx], this);
    },
    
    renderList : function () {
        var inst = this,
            list = inst.spells,
            $wrapper = $(document.createElement('div'))
                .addClass('spell-list-containter');
        
        fast.forEach(list, function (spell, i, arr) {
            $wrapper.append(inst.spellListing(i));
        });
        
        return $wrapper;
    },
    
    exportList : function () {
        // for sharing
        return setup.share.exportToString(this);
    },
    
    // for SugarCube's state system
    constructor : window.SpellList,
    toJSON : function () {
        return JSON.reviveWrapper('new SpellList(' + JSON.stringify(this.name) + ', ' + JSON.stringify(this.tags) + ', ' + JSON.stringify(this.spells) + ', ' + JSON.stringify(this.access) + ')');
    },
    clone : function () {
        return new SpellList(this.name, this.tags, this.spells, this.access);
    }
};

// update spell book order
prerender['update-list-order'] = function () {
    SpellList.sortByAccess();
};

// handle access events
$(document).on(':access-book', function (e) {
    if (typeof e.inst === 'string') {
        SpellList.isAccessed(inst);
    } else if (typeof e.inst === 'object' && e.inst.hasOwnProperty('spells')) {
        e.inst.updateAccess();
    } else {
        console.warn('Event ":access-book" triggered with invalid event object: ', e.inst);
    }
});

$(document).on(':new-book', function (e) {
    notify('Spellbook added!');
    if (State.variables.listOfLists.length === 100 && passage() !== 'Import') {
        UI.alert("You just made your 100th spellbook.  Congratulations!\n\nIf you begin to experience lag or unresponsiveness, deleting old spellbooks may help.");
    } else if (State.variables.listOfLists.length === 200 && passage() !== 'Import') {
        UI.alert("You just made your 200th spellbook.  Congratulations!\n\nIf you begin to experience lag or unresponsiveness, deleting old spellbooks may help.");
    } else if (State.variables.listOfLists.length === 300 && passage() !== 'Import') {
        UI.alert("You just made your 300th spellbook.  Congratulations!\n\nIf you begin to experience lag or unresponsiveness, deleting old spellbooks may help.");
    } else if (State.variables.listOfLists.length === 500 && passage() !== 'Import') {
        UI.alert("You just made your 500th spellbook.  Congratulations!\n\nIf you begin to experience lag or unresponsiveness, deleting old spellbooks may help.");
    } else if (State.variables.listOfLists.length === 1000 && passage() !== 'Import') {
        UI.alert("You just made your 1000th spellbook.\n\nHOW IS YOUR BROWSER STILL RUNNING?");
    }
});