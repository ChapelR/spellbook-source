// not for beta

State.variables.custom = [];

function loadSpellForEditing () {
    // todo: i need to clean up the maker for this to work... or fork it
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

function callCustomSetup (openDialog) {
    Dialog.setup('Create Custom Spell', 'custom-spell-dialog');
    Dialog.wiki(Story.get('Custom Edit').text + '<br /><br />');
    Dialog.append(constructTextInputInterface());
    Dialog.wiki(Story.get('Custom Confirm').text);
    if (openDialog) {
        Dialog.open();
    }
}

setup.custom = {
    debugCreate : createCustomSpell,
    create : customSpell,
    textInput : createSpellInterfaceText,
    buildTextInputs : constructTextInputInterface,
    dialog : callCustomSetup
};