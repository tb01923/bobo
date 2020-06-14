# bobo
a library to observe events occuring in the browser


The classic Bobo doll experiment, identified this basic form of learning in 1961. The importance of observational learning lies in helping individuals, especially children, acquire new responses by observing others' behavior (https://en.wikipedia.org/wiki/Observational_learning).

# goals
1. No vendor and Native implementation
2. Minmize cycletime in journey work
3. Browser: concenttates on sending atomic data to the observer
4. Server: Save Data && then later curates the business Events
5. SMALL Footprint / Fast Load (no TMS)
6. Track across journeys (single persistable domain cookie, session cookies)

# unknowns
1. Polyfill [ https://github.com/megawac/MutationObserver.js/tree/master or
 https://github.com/googlearchive/MutationObservers (follow links) ]
2. Batching of event postback to server
3. Design of event schema for event types
4. Server design
5. Babel of this... 
