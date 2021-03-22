const { isValidKey, findObjectFromPath } = require("./utils.js");
var EventEmitter = require("events");

const isInteger = function (str) {
  return !isNaN(str) && !isNaN(parseInt(str));
};

//create a proxy that allows knots to be used as properties ex: root[lvl_1][lvl_2]
const generateKnotIndexer = function (context) {
  return new Proxy(context, {
    get(target, prop) {
      //return own property
      if (prop in target) return target[prop];

      if (!target.knots.size > 0) return null;

      const propKey = isInteger(prop) ? parseInt(prop) : prop;

      //it's a namespace 'a.b.c'
      if (typeof propKey === "string" && propKey.indexOf(".") > -1) {
        let current = context;
        const path = propKey.split(".");
        //drill down on each part of the path to find the correct knot
        for (const part of path) {
          if (!current || !current.knots.size > 0) return null;
          const partKey = isInteger(part) ? parseInt(part) : part;
          if (!current.knots.has(partKey)) return null;
          current = current.knots.get(partKey);
        }

        return current;
      }

      return context.knots.has(propKey) ? context.knots.get(propKey) : null;
    },
    set(target,prop,value){
      if (prop in target && prop!=="value" && prop!=="state")  {
        target[prop] = value;
        return true;
      }
      
      if(target.hasOwnProperty("value") ){
        //console.log("we can set:" + prop + " to " + value)
        const cached = target.value;
        target[prop] = value;
        if(cached!==value){
          const stateRoot = target.findStateRoot()
          const stateEmitter = stateRoot !=null ? stateRoot.__privateEmitter :null;
          if(!!stateEmitter) stateEmitter.emit("value_updated", target,cached);

          const rootEmitter = target.findRoot().__privateEmitter;
          if (!!rootEmitter) rootEmitter.emit("value_updated", target,cached);
        }
      }

      if(target.hasOwnProperty("__stateful")){
        console.log("replacing state")
      }
      
      return true;
    }
  });
};

const defaults = {
  eventful: false,
  stateful: false,
  cachable: false,
  valuable:false
};

class Knot {
  constructor(key, options) {
    if (!isValidKey(key))
      throw new Error(
        `A knot must have a 'KEY' property either a non-empty string or  a number > 0. \n
            Instead got:'${key}'`
      );

    this.__privateKey = { value: key };
    Object.freeze(this.__privateKey);

    this.__privateParent = { value: null };

    this.knots = new Map();

    let config = { ...defaults, ...options };
    if (config.eventful) {
      this.__privateEmitter = new EventEmitter();
    }
    if (config.stateful) {
      this.__stateful = true;
    }
    if(config.valuable){
      this.value = null;
    }
    //if serve as root we need to create eventhandlers

    return generateKnotIndexer(this);
  }
  get KEY() {
    return this.__privateKey.value;
  }

  get hasKnots() {
    return this.knots.size > 0;
  }
  hasKnot(key) {
	  if(!this.hasKnots) return false;
	  const realKey = isInteger(key) ? parseInt(key):key;
    return  this.knots.has(realKey);
  }

  get isRoot() {
    return !this.parent;
  }

  get parent() {
    return this.__privateParent.value;
  }

  set parent(knot) {
    if (!!this.parent)
      throw new Error(
        "Parent already set! Avoid setting parent yourself, this is done internally when new knots are added"
      );

    this.__privateParent.value = knot;
    Object.freeze(this.__privateParent);
  }
  get children() {
    return Array.from(this.knots.values());
  }

  get events() {
    return this.__privateEmitter;
  }
  get isStateful(){
    return this.hasOwnProperty("__stateful")
  }
  get isEventful(){
    return this.events!=null;
  }
  get isValuable(){
    return this.hasOwnProperty("value");
  }

  tie(knot) {
    if (!knot || !(knot instanceof Knot))
      throw new Error(
        `Invalid knot type! This must be an instance of Knot! \n
            Instead got:${typeof knot}`
      );

    if (this.hasKnot(knot.KEY))
      throw new Error(`A knot with this key('${knot.KEY}') already exists!`);

    knot.parent = this;
    this.knots.set(knot.KEY, knot);

    const emiter = this.findRoot().__privateEmitter;
    if (!!emiter) emiter.emit("knot_tied", knot);
  }
  
  replace(knot){
    if (!knot || !(knot instanceof Knot))
    throw new Error(
      `Invalid knot type! This must be an instance of Knot! \n
          Instead got:${typeof knot}`
    );

    if (!this.hasKnot(knot.KEY))
    throw new Error(`A knot with this key('${knot.KEY}') doesn't exist!`);
    
    const isStateful = knot.isStateful;
    const EVT_NAME = isStateful ? "state_replaced" : "knot_replaced";
    if(isStateful && knot.isEventful){

    }
    

    knot.parent=this;
    this.knots.set(knot.KEY, knot);
    const emiter = this.findRoot().__privateEmitter;
    if (!!emiter) emiter.emit(EVT_NAME, knot);
  }
  //remove current knot from parent's knots
  //do not throw errors
  unTie() {
    if (this.isRoot) throw new Error("Can't use pop on a root knot!");

    const emiter = this.findRoot().__privateEmitter;
    if (!!emiter) emiter.emit("knot_untied", this);

    this.parent.knots.delete(this.KEY);
  }
  untieAll() {
    const emiter = this.findRoot().__privateEmitter;
    if (!!emiter) emiter.emit("all_knots_untied", this.getPath());
    this.knots.clear();
  }

  findRoot() {
    if (this.isRoot) return this;
    return this.parent.findRoot();
  }
  findStateRoot(){
    if(this.__stateful) return this;
    if(this.parent!=null) return this.parent.findStateRoot();
    return null;
  }

  getPath() {
    let current = this;
    let stack = [current.KEY];

    if (this.isRoot) return stack;

    while (true) {
      current = current.parent;
      stack.push(current.KEY);
      if (current.isRoot) break;
    }

    return stack.reverse();
  }
  getNamespace() {
    let stack = this.getPath();
    if (stack.length < 2) return stack[0];
    return stack.join(".");
  }

  //recursive function to create on object tree from knot
  toObject(childrenOnly = false) {
    //check if it's the first time running the function
    let firstCall = arguments.length < 2;
    //get the refference to the previous namespace or create a new one
    let prevNamespace = firstCall ? {} : arguments[1];
    //create a referrence to the nextNamesace object will be injected into
    let nextNamespace = prevNamespace;
    //excluding self returns a list of knots
    if (!childrenOnly) {
      // the children will be injected into this instead of prevoius
      nextNamespace[this.KEY] = {};
      nextNamespace = prevNamespace[this.KEY];
    }
    //inject properties picked by the class that extends this class
    this.injectObject(nextNamespace);

    this.knots.forEach((knot) => {
      //create a an empty object literal for each children
      nextNamespace[knot.KEY] = {};
      //recursive call to each knot, forced to use children only because we created the NS above
      //inject the result back into this knot's namespace
      nextNamespace[knot.KEY] = knot.toObject(true, nextNamespace[knot.KEY]);
    });

    return prevNamespace;
  }
  //this will be called when contruction toObject
  //you cand add your own properties to the currentNamespace
  injectObject(currentNS) {
    //ex: currentNS.name = this.someProp
  }
  drill(callback, childrenOnly = false) {
    let current = arguments.length > 2 ? arguments[2] : this;
    if (!childrenOnly) callback(current);
    current.knots.forEach((knot) => {
      this.drill(callback, false, knot);
    });
  }
  get hasSiblings() {
    if (this.isRoot) return false;
    return this.parent.knots.size > 1;
  }
  siblings() {
    if (!this.hasSiblings) return [];
    return this.parent.children.filter((knot) => knot.KEY !== this.KEY);
  }

  json(fullTree = false, indentation = null) {
    if (!fullTree)
      return JSON.stringify(
        this,
        function (key, val) {
          //exclude private members
          if (!key.startsWith("__")) return val;
        },
        indentation
      );

    return JSON.stringify(
      this,
      function (key, val) {
        if (val instanceof Map) {
          //convert map to array
          return Array.from(val.entries());
        } else {
          if (!key.startsWith("__")) return val;
        }
      },
      indentation
    );
  }
}
module.exports = Knot;
