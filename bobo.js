const bobo = function () {

    ///////////////////////////////////////////////////////////////
    // DOM Mutation Event Handler
    //      https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom/14570614
    ///////////////////////////////////////////////////////////////
    var observeDOM = (function () {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        return function (obj, callback) {
            if (!obj || !obj.nodeType === 1) return; // validation

            if (MutationObserver) {
                // define a new observer
                var obs = new MutationObserver(function (mutations, observer) {
                    callback(mutations);
                })
                // have the observer observe foo for changes in children
                obs.observe(obj, {childList: true, subtree: true});
            }

            else if (window.addEventListener) {
                obj.addEventListener('DOMNodeInserted', callback, false);
                obj.addEventListener('DOMNodeRemoved', callback, false);
            }
        }
    })();

    ///////////////////////////////////////////////////////////////
    // Attach events to all clickables
    ///////////////////////////////////////////////////////////////

    // helpers
    const not = (boolean) => !boolean;
    const or = (boolean1, boolean2) => boolean1 || boolean2;
    const any = (arr) => arr.reduce(or, false);
    const map = (f) => (o) => o.map(f);
    const identity = i => i;
    const leftToRightComposition = (f, g) => (x) => g(f(x));
    const pipe = (functions) => functions.reduce(identity, leftToRightComposition);

    // predicates
    const isTag = (tagName) => (element) =>
        element.tagName.toLowerCase() === tagName;

    const hasEventHandler = (eventName) => (element) =>
        element[eventName] !== null && element[eventName] !== undefined;

    const isInput = isTag('input');
    const isInputType = (inputType) => (element) =>
        isInput(element) && element.type.toLowerCase() === inputType;


    // elementPassesAnyPredicate: input an array of (DOM -> boolean) "predicate" functions
    //      and then a DOM element.  return true if the DOM element passes any of the predicates
    const elementPassesAnyPredicate = (predicateArray) => (element) => {
        // apply the DOM element to some function f
        const applyelement = (f) => f(element);
        // convert Array<predicate> to Array<boolean>
        const bools = predicateArray.map(applyelement);
        // if any of the bools are true the element is clickable
        return any(bools)
    }

    // these are things that can be changed by typing
    const isBlurable = elementPassesAnyPredicate([
        isInputType('text'),
        isInputType('textarea')
    ]);

    // these are things that are inherently clickable
    const isClickable = elementPassesAnyPredicate([
        isTag('button'),
        isTag('a'),
        isInputType('submit'),
        isInputType('button'),
        isInputType('radio'),
        isInputType('checkbox'),
        hasEventHandler('onclick')
    ]);

    //////////////////////////////////////////////////////////////////////////////////////////
    // Logic to not fire duplicate events
    //////////////////////////////////////////////////////////////////////////////////////////
    var alreadyFired = {};
    const makeKey = (element, event) => '' + event.type + event.timeStamp;
    const hasNotFired = (element, event) => {
        const key = makeKey(element, event);

        if (alreadyFired[key]) {
            return false;
        }
        alreadyFired[key] = 1;
        return true;
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // TODO: build the object we want to send to the server, some combination of
    //       DOM attributes and values
    //////////////////////////////////////////////////////////////////////////////////////////
    const makeBasicEventObject = (element, event) => {
        const object = {
            on: (new Date()).toISOString(),
            eventType: event.type,
            tagName: element.tagName,
            source: window.location.href
        }

        if (element.type) object.elementType = element.type;
        if (element.id) object.id = element.id;
        if (element.name) object.name = element.name;
        if (element.value) object.value = element.value;
        if (element.checked) object.checked = element.checked;
        if (element.href) object.href = element.href;

        return object;
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // TODO: build asynch HTTP capabilities here and don't wait on return
    //////////////////////////////////////////////////////////////////////////////////////////
    const executeSendEvent = (event) => {
        const div = "<div>" + JSON.stringify(event) + "</div>";
        const right = document.querySelector('html > body > .right');
        console.log(JSON.stringify(event))
        right.insertAdjacentHTML("beforeend", div);
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // TODO: perhaps queue events to send?
    //////////////////////////////////////////////////////////////////////////////////////////
    const sendEvent = (...args) => {
        const event = args.pop();
        const element = args.pop();

        //////////////////////////////////////////////////
        // we might not want all clicks to fire
        //////////////////////////////////////////////////
        if (hasNotFired(element, event)) {
            const object = makeBasicEventObject(element, event);
            executeSendEvent(object);
        }
    }

    // insrument at a dom node
    const instrumentAt = (parentElement) => {

        const innerInstrument = (element) => {
            if (isClickable(element)) {
                element.addEventListener('click', sendEvent.bind(null, element));
            }

            if (isBlurable(element)) {
                element.addEventListener('blur', sendEvent.bind(null, element));
            }

            for (let item of element.children) {
                innerInstrument(item);
            }
        }

        innerInstrument(parentElement);

        ///////////////////////////////////////////////////////////////
        // observe changes to the DOM, and instrument each of them
        ///////////////////////////////////////////////////////////////
        observeDOM(parentElement, function (domMutation) {
            const handleRecord = (record) => {
                record.addedNodes.forEach(innerInstrument)
            }

            domMutation.forEach(handleRecord)
        });
    }

    const whenReady = _ => {
        ///////////////////////////////////////////////////////////////
        // start once the DOM is ready
        //    https://www.sitepoint.com/jquery-document-ready-plain-javascript/
        ///////////////////////////////////////////////////////////////
        const isReady = (readyState) => (
            readyState === "complete" || (
                readyState !== "loading" &&
                !documentElement.doScroll
            ));

        return new Promise((res, rej) => {

            (function startWhenReady() {
                if (isReady(document.readyState)) {
                    res();
                } else {
                    document.addEventListener("DOMContentLoaded", res);
                }
            })();
        })
    }

    return {
        "instrumentAt": instrumentAt,
        "whenReady": whenReady
    }
}


