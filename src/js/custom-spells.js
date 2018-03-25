// not for beta

State.variables.custom = [];

function loadSpellForEditing (spellObj) {
    
    var st = State.temporary;
    st.customEdit = spellObj;
    
    $(document).one(':dialogopen', function () {
        // the spell edit dialog is opened, but just to be sure
        if (!$('#ui-dialog-body').hasClass('custom-spell-dialog')) {
            return;
        }
        
        // we need to assign every element the appropriate editing value:
        setTimeout(function () {
            // name
            $('input[name="textbox--name"]').val(spellObj.name);
            // classes
            fast.forEach(spellObj.classes, function (className) {
                var el = '#checkbox--' + spells.get.cleanText(className);
                $(el).prop('checked', true);
            });
            // level
            $('#dropdown--level').val(spellObj.level);
            // components
            if (spellObj.components.verbal) {
                $('#checkbox--components0').prop('checked', true);
            }
            if (spellObj.components.somatic) {
                $('#checkbox--components1').prop('checked', true);
            }
            if (spellObj.components.material) {
                $('#checkbox--components2').prop('checked', true);
                if (spellObj.components.materials_needed && spellObj.components.materials_needed[0]) {
                    $('#textbox--components3').val(spellObj.components.materials_needed[0]);
                }
            }
            // ritual
            if (spellObj.ritual) {
                $('#checkbox--ritual').prop('checked', true);
            }
            // cast time
            $('input[name="var-action-cast-time"]').val(spellObj.casting_time);
            // range
            $('input[name="var-range-spell-range"]').val(spellObj.range);
            // cast time
            $('input[name="var-duration-duration"]').val(spellObj.duration);
            // description
            $('#textarea--descr').val(spellObj.description);
            
            // trigger everything
            var toTrigger = $('#ui-dialog-body input').toArray().concat($('#ui-dialog-body textarea'));
            fast.forEach(toTrigger, function (el) {
                $(el).trigger('change');
                $(el).trigger('input');
            });
        }, Engine.minDomActionDelay || 40);
    });
}

function createCustomSpell ( obj /* object */ ) {
    var spellObj = {
        // the base object to build off of
        "casting_time": "1 action",
        "classes": [
            "bard"
        ],
        "components": { // generate
            "material": true,
            "materials_needed": [
                "something"
            ],
            "raw": "V, S, M (something)",
            "somatic": true,
            "verbal": true
        },
        "description": "You do something ''amazing''.",
        "duration": "Instantaneous",
        "level": "cantrip",
        "name": "Custom Spell",
        "range": "Touch",
        "ritual": false,
        "school": "evocation",
        "tags": [ // generate
            "cleric",
            "cantrip"
        ],
        "type": "Evocation cantrip",
        "custom": true // generate
    };
    if (obj && typeof obj === 'object') {
        
        obj.components = {
            material : (obj.comp.array.includes('m')) ? true : false,
            somatic : (obj.comp.array.includes('s')) ? true : false,
            verbal : (obj.comp.array.includes('v')) ? true : false,
            materials_needed : [ ((obj.comp.mat) ? String(obj.comp.mat) : '') ],
            raw : (obj.comp.array.join(', ').toUpperCase()) + ((obj.comp.mat) ? ' (' + String(obj.comp.mat) + ')' : '')
        };
        
        obj.tags = [];
        fast.forEach(obj.classes, function (className) {
            fast.push(obj.tags, String(className.trim().toLowerCase()));
        });
        obj.classes = clone(obj.tags);
        fast.push(obj.tags, (obj.level = 'cantrip') ? 'cantrip' : (obj.level[0] + 'level'));
        obj.type = String(obj.school + ' ' + obj.level + ((obj.ritual) ? ' (ritual)' : '')).toLowerCase().toUpperFirst();
        
        var props = Object.keys(obj);
        fast.forEach(props, function (prop) {
            if (spellObj.hasOwnProperty(prop)) {
                spellObj[prop] = obj[prop];
            }
        });
        
        return spellObj;
        
    } else {
        console.error('Invalid spell object in custom spell definition.');
        return false;
    }
}

function customSpell (obj) {
    var newSpell = createCustomSpell(obj);
    fast.push(State.variables.custom, newSpell);
}

function replaceExistingCustomSpell (oldSpellObj, newSpellObj) {
    // find and replace existing custom spell across all instances
    setup.loading.show();
    var sv = State.variables;
    
    var target = fast.findIndex(sv.custom, function (spell) {
        return (spell.name === oldSpellObj.name);
    });
    if (target > -1) {
        sv.custom[target] = newSpellObj;
    }
    
    fast.forEach(sv.lists, function (book) {
        var replaceMe = fast.findIndex(book.spells, function (spell) {
            return spell.name === oldSpellObj.name;
        });
        if (replaceMe > -1) {
            book.spells[replaceMe] = newSpellObj;
        }
    });
    
    console.log(oldSpellObj, newSpellObj);
    
    Engine.play(passage());
}

function createSpellInterfaceText (storyVar /* string (story variable) */, listName /* string (slug) */, listOptions /* array */) {
    if (!storyVar || typeof storyVar !== 'string') {
        console.error('invalid storyVar in createSpellInterfaceText() -> ', storyVar);
        return;
    }
    if (storyVar[0] !== '$' && storyVar[0] !== '_') {
        console.error('invalid storyVar in createSpellInterfaceText() -> ', storyVar);
        return;
    }
    if (!listName || typeof listName !== 'string') {
        console.error('invalid listName in createSpellInterfaceText() -> ', listName);
        return;
    } 
    if (!listOptions || !Array.isArray(listOptions) || !listOptions.length) {
        console.error('invalid listOptions in createSpellInterfaceText() -> ', listOptions);
        return;
    }
    listName = spells.get.cleanText(Util.slugify(listName)); // prep list name
    
    var $wrapper = $(document.createElement('span')),
        $input = $(document.createElement('input'))
            .attr({
                type : 'text',
                name : ('var' + Util.slugify(storyVar) + '-' + listName).toLowerCase(),
                list : listName,
                value : State.getVar(storyVar)
            })
            .addClass('custom-spell-field')
            .on('input', function () { // maybe on 'change' would be better?  i can never remember
                State.setVar(storyVar, $(this).val());
            }),
        $data = $(document.createElement('datalist'))
            .attr('id', listName)
            .addClass('custom-spell-data');
    
    fast.forEach(listOptions, function (opt) {
        var $option = $(document.createElement('option'))
            .attr('value', opt)
            .appendTo($data);
    });
    
    // construct element
    $wrapper.append($input, $data).addClass('custom-spell-input-wrapper');
    
    return $wrapper;
} // send all to `Dialog.append()`

function constructTextInputInterface () {
    // handles: action, range, and duration
    var $action = createSpellInterfaceText('_action', 'cast-time', ['1 action', '1 bonus action', '1 reaction']),
        $range = createSpellInterfaceText('_range', 'spell-range', ['self', 'touch', 'sight', '30 feet', '60 feet', '90 feet', '100 feet', '120 feet', '150 feet']),
        $duration = createSpellInterfaceText('_duration', 'duration', ['instantaneous', 'concentration', '1 round', '1 minute', '1 hour', '8 hours', '10 minutes', 'until dispelled']);
    
    function labelMe (labelText, $el) {
        return $(document.createElement('label'))
            .wiki(labelText + ': <br />')
            .append($el)
            .wiki('<br /><br />');
    }
        
    return $(document.createElement('span'))
        .addClass('custom-spell-edit-wrapper')
        .append(labelMe('Casting Time', $action), labelMe('Range', $range), labelMe('Duration', $duration));
}

// classes: checkboxes; level: dropdown; school: dropdown; components: checkbox + normal textbox; ritual: checkbox: these can go right in the dialog box

function callCustomSetup (openDialog, edit) {
    Dialog.setup((edit ? 'Create Custom Spell' : 'Edit Custom Spell'), 'custom-spell-dialog');
    Dialog.wiki(Story.get('Custom Edit').text + '<br /><br />');
    Dialog.append(constructTextInputInterface());
    Dialog.wiki(Story.get('Custom Confirm').text);
    if (openDialog) {
        Dialog.open();
    }
}

setup.custom = {
    createNoAdd : createCustomSpell,
    create : customSpell,
    textInput : createSpellInterfaceText,
    buildTextInputs : constructTextInputInterface,
    dialog : callCustomSetup,
    loadToEdit : loadSpellForEditing,
    replaceSpell : replaceExistingCustomSpell
};