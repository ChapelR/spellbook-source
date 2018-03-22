// fast array methods to squeeze out better performance
(function (exp) {
    
    function fastForEach (arr, fn) {
        var lt = arr.length, i;
        
        for (i = 0; i < lt; i++) {
            fn(arr[i], i, arr);
        }
    }
    
    function fastPush (arr, item) {
        arr[arr.length] = item;
    }
    
    function fastFilter (arr, fn) {
        var lt = arr.length,
            ret = [], i;
        
        for (i = 0; i < lt; i++) {
            if (fn(arr[i], i, arr)) {
                fastPush(ret, arr[i]);
            }
        }
        return ret;
    }
    
    function fastMap (arr, fn) {
        var lt = arr.length,
            ret = new Array(lt), i;
        
        for (i = 0; i < lt; i++) {
            ret[i] = fn(arr[i], i, arr);
        }
        
        return ret;
    }
    
    function fastIndexOf (arr, item) {
        var lt = arr.length, i;
        
        for (i = 0; i < lt; i++) {
            if (arr[i] === item) {
                return i;
            }
        }
        return -1;
    }
    
    function fastFind (arr, fn) {
        var lt = arr.length, i;
        
        for (i = 0; i < lt; i++) {
            if (fn(arr[i], i, arr)) {
                return arr[i];
            }
        }
        return undefined;
    }
    
    function fastFindIndex (arr, fn) {
        var lt = arr.length, i;
        
        for (i = 0; i < lt; i++) {
            if (fn(arr[i], i, arr)) {
                return i;
            }
        }
        return -1;
    }
    
    exp.fast = {
        filter : fastFilter,
        forEach : fastForEach,
        push : fastPush,
        map : fastMap,
        indexOf : fastIndexOf,
        find : fastFind,
        findIndex: fastFindIndex
    };
    
    
}(window));