import {doTest} from 'etc/perf/utils';
import ClassDecorator from '../../class-decorator';


// Use an N of 100,000 for each test.
const n = 100000;


// ----- Base Case -------------------------------------------------------------

class UndecoratedClass {
  method() {
    // Empty block.
  }
}

const baseTime = doTest({n, label: '[ ] Decorated [ ] Uses Proxy Constructor [ ] Proxy Invokes Original [ ] Decorated Class is Subclassed'}, () => {
  return new UndecoratedClass();
});


// ----- No Proxy Constructor --------------------------------------------------

const SimpleDecorator = ClassDecorator(Ctor => {
  Ctor.prototype.foo = 'bar';
});

@SimpleDecorator
class SimpleDecoratedClass {
  method() {
    // Empty block.
  }
}

doTest({n, label: '[X] Decorated [ ] Uses Proxy Constructor [ ] Proxy Invokes Original [ ] Decorated Class is Subclassed', baseTime}, () => {
  return new SimpleDecoratedClass();
});


// ----- Proxy Constructor That Does Not Invoke Original Constructor -----------

const WithProxyConstructor = ClassDecorator(() => {
  return () => {
    // Empty block.
  };
});

@WithProxyConstructor
class ProxyDecoratedClass {
  method() {
    // Empty block.
  }
}

doTest({n, label: '[X] Decorated [X] Uses Proxy Constructor [ ] Proxy Invokes Original [ ] Decorated Class is Subclassed', baseTime}, () => {
  return new ProxyDecoratedClass();
});


// ----- Proxy Constructor That Invokes Original Constructor -------------------

const WithProxyConstructorThatInvokesOriginal = ClassDecorator(() => {
  return ({args, constructor}) => {
    constructor(...args);
  };
});

@WithProxyConstructorThatInvokesOriginal
class ProxyInvokingDecoratedClass {
  method() {
    // Empty block.
  }
}

doTest({n, label: '[X] Decorated [X] Uses Proxy Constructor [X] Proxy Invokes Original [ ] Decorated Class is Subclassed', baseTime}, () => {
  return new ProxyInvokingDecoratedClass();
});

// ----- Proxy Constructor That Invokes Original Constructor (Subclassed) ------

class SubclassOfDecorated extends ProxyInvokingDecoratedClass { }

doTest({n, label: '[X] Decorated [X] Uses Proxy Constructor [X] Proxy Invokes Original [X] Decorated Class is Subclassed', baseTime}, () => {
  return new SubclassOfDecorated();
});
