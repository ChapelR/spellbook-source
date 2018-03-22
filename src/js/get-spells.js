var validProps = ['casting_time', 'range', 'duration'];

function getList (arg) {
    if (!arg || !Array.isArray(arg)) {
        return window.spells.list;
    }
    return arg;
}

function clean (str) {
    var ret = String(str);
    ret = str.trim().toLowerCase();
    ret = ret.replace(/\s\s+/g, ' ');
    
    return ret;
}

function compare (a, b) {
    if (clean(a.name) < clean(b.name)) {
        return -1;
    }
    if (clean(a.name) > clean(b.name)) {
        return 1;
    }
    return 0;
}

function sortList (list, term) {
    if (term) {
        var first = [], others = [];
        for (var i = 0; i < list.length; i++) {
            if (clean(list[i].name).indexOf(term) === 0) {
                first.push(list[i]);
            } else {
                others.push(list[i]);
            }
        }
        first = sortList(first);
        others = sortList(others);
        return first.concat(others);
    }
    var ret = clone(list);
    return ret.sort(compare);
    
}

function getNumberFromString (str) {
    var num = str.match(/\d/g);
    if (!num || num.length < 1) {
        return false;
    } else {
        return Number(num.join(''));
    }
}

function getSpellsByName (name, list) {
    // return array of matching spells with similar names
    list = getList(list);
    
    name = clean(name);
    return sortList(fast.filter(list, function (spellObj, idx, arr) {
        var spellName = clean(spellObj.name);
        return spellName.includes(name);
    }), name);
}

function getSpellsByTag (tagName, list) {
    // return array of spells matching a class or tag
    list = getList(list);
    
    tagName = clean(tagName);
    return sortList(fast.filter(list, function (spellObj, idx, arr) {
        var spellTags = spellObj.tags;
        return spellTags.includes(tagName);
    }));
}

function getSpellsByLevel (level, list) {
    // get array of spells by level
    list = getList(list);
    
    var levelStr = Math.trunc(Number(level));
    if (!Number.isInteger(level) || level < 0 || level > 9) {
        console.warn('Invalid level "' + level + '" in getSpellsByLevel().');
        return list;
    }
    
    if (levelStr === 0) {
        levelStr = 'cantrip';
    } else {
        levelStr = 'level' + levelStr;
    }
    
    return getSpellsByTag(levelStr, list);
}

function getSpellsByComponent (compArray, list) {
    // checklist
    list = getList(list);
    
    if (!Array.isArray(compArray) && compArray.length !== 3) {
        console.warn('Invalid component array in getSpellsByComponent().');
        return list;
    }
    return sortList(fast.filter(list, function (spellObj, idx, arr) {
        var spellComp = spellObj.components;
        if (!compArray[0] && spellComp.verbal) {
            return false;
        }
        if (!compArray[1] && spellComp.somatic) {
            return false;
        }
        if (!compArray[2] && spellComp.material) {
            return false;
        }
        if (!compArray[3] && spellComp.materials_needed) {
            if (spellComp.components.materials_needed.includes(' gp ')) {
                return false;
            }
        }
        return true;
    }));
}

function getSpellsBySchool (school, list) {
    list = getList(list);
    
    if (!school) {
        return list;
    }
    return sortList(fast.filter(list, function (spellObj, idx, arr) {
        var spellSchool = spellObj.school;
        return school === spellSchool;
    }));
}

function getSpellsByRitual (list) {
    list = getList(list);
    
    return sortList(fast.filter(list, function (spellObj, idx, arr) {
        return spellObj.ritual;
    }));
}

function getSpellsByThing (prop, str, list) {
    list = getList(list);
    
    if (!validProps.includes(prop)) {
        console.warn('invalid propert in getSpellsByThing()');
        return list;
    }
    if (typeof str === 'number') {
        str = clean(String(str));
    }
    return sortList(fast.filter(list, function (spellObj) {
        var property = clean(spellObj[prop]) + '';
        return (property.includes(str));
    }));
}

function getSpellsByNotThing (prop, avoid, list) {
    list = getList(list);
    
    if (!validProps.includes(prop)) {
        console.warn('invalid propert in getSpellsByThing()');
        return list;
    }
    return sortList(fast.filter(list, function (spellObj) {
        var property = clean(spellObj[prop] + '');
        return !fast.some(avoid, function (item) {
            return property.includes(item);
        });
    }));
}

function getSpellsByCastingTime (time, list) {
    if (typeof time !== 'string') {
        return list;
    }
    if (time === 'other') {
        return getSpellsByNotThing('casting_time', [
            '1 action', 
            '1 bonus action', 
            '1 reaction',
            'minute',
            'hour'
        ], list);
    }
    if (time === 'minutes') {
        time = 'minute';
    } else if (time === 'hours') {
        time = 'hour'
    }
    return getSpellsByThing('casting_time', time, list);
}

function getSpellsByRange (range, list) {
    if (typeof range !== 'string') {
        return list;
    }
    
    range = clean(range);
    
    var rangeNum = getNumberFromString(range);
    
    return sortList(fast.filter(list, function (spellObj) {
        var spellRange = clean(spellObj.range),
            spellRangeNum = getNumberFromString(spellRange);
        
        if (spellRangeNum && rangeNum) {
            if (range === 'more than 150 feet') {
                if (spellRangeNum > 150 || spellRange.includes('mile')) {
                    return true;
                }
            } else if (range === 'less than 30 feet' && !spellRange.includes('mile')) {
                if (spellRangeNum < 30) {
                    return true;
                }
            } else {
                if (spellRangeNum === rangeNum) {
                    return true;
                }
            }
        }
        if (rangeNum) {
            // add spaces to ensure 30 and 300 aren't conflated
            return spellRange.includes(' ' + rangeNum + ' ');
        }
        return spellRange.includes(range);
    })); 
}

function getSpellsByDuration (time, list) {
    if (typeof time !== 'string') {
        return list;
    }
    if (time === 'other') {
        return getSpellsByNotThing('duration', [
            'instant', 
            'concen', 
            'round', 
            'minute', 
            'hour', 
            'other'
        ], list);
    }
    if (time === 'rounds') {
        time = 'round';
    } else if (time === 'minutes') {
        time = 'minute';
    } else if (time === 'hours') {
        time = 'hour';
    } else if (time === 'concentration') {
        time = 'concen';
    }
    return getSpellsByThing('duration', time, list);
}

spells.list = sortList(spells.list);

// exports
window.spells.get = {
    cleanText : clean,
    checkList : getList,
    sort : sortList,
    byName : getSpellsByName,
    byTag : getSpellsByTag,
    byLevel : getSpellsByLevel,
    byComponent : getSpellsByComponent,
    bySchool : getSpellsBySchool,
    byCastingTime : getSpellsByCastingTime,
    byRange : getSpellsByRange,
    byDuration : getSpellsByDuration,
    byRitual : getSpellsByRitual,
    byThing : getSpellsByThing,
    byNotThings : getSpellsByNotThing
};