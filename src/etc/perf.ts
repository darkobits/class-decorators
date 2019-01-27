import {doTest} from 'lib/utils';
import ClassDecorator from '../class-decorator';


console.clear();


// Use an N of 1 million for each test.
const iterations = 1000000;


// ----- Constructing Plain Classes --------------------------------------------

export class UndecoratedClass {
  method() {
    // Empty block.
  }
}

const baseTime = doTest({
  iterations,
  label: '[ ] Decorated [ ] Uses Proxy Constructor [ ] Proxy Invokes Original'
}, () => {
  return new UndecoratedClass();
});


// ----- Constructing Decorated Class with Simple Decorator --------------------

const SimpleDecorator = ClassDecorator(Ctor => {
  Ctor.prototype.foo = 'bar';
});

@SimpleDecorator
class SimpleDecoratedClass {
  method() {
    // Empty block.
  }
}

doTest({
  iterations,
  label: '[X] Decorated [ ] Uses Proxy Constructor [ ] Proxy Invokes Original',
  baseTime
}, () => {
  return new SimpleDecoratedClass();
});


// ----- Constructing Decorated Class With Proxy Constructor -------------------

const WithProxyConstructor = ClassDecorator(() => {
  return () => {
    // Empty block.
  };
});

@WithProxyConstructor
export class ProxyDecoratedClass {
  method() {
    // Empty block.
  }
}

doTest({
  iterations,
  label: '[X] Decorated [X] Uses Proxy Constructor [ ] Proxy Invokes Original',
  baseTime
}, () => {
  return new ProxyDecoratedClass();
});


// ----- Constructing Decorated Classes ----------------------------------------

const WithProxyConstructorThatInvokesOriginal = ClassDecorator(() => {
  return ({args, constructor}) => {
    constructor(...args);
  };
});

@WithProxyConstructorThatInvokesOriginal
export class ProxyInvokingDecoratedClass {
  method() {
    // Empty block.
  }
}

doTest({
  iterations,
  label: '[X] Decorated [X] Uses Proxy Constructor [X] Proxy Invokes Original',
  baseTime
}, () => {
  return new ProxyInvokingDecoratedClass();
});
