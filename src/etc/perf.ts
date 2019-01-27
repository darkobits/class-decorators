import {doTest} from 'lib/utils';
import ClassDecorator from '../class-decorator';


// Use an N of 1 million for each test.
const n = 1000000;


// ----- Base Case -------------------------------------------------------------

class UndecoratedClass {
  method() {
    // Empty block.
  }
}

const baseTime = doTest({n, label: '[ ] Decorated [ ] Uses Proxy Constructor [ ] Proxy Invokes Original'}, () => {
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

doTest({n, label: '[X] Decorated [ ] Uses Proxy Constructor [ ] Proxy Invokes Original', baseTime}, () => {
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

doTest({n, label: '[X] Decorated [X] Uses Proxy Constructor [ ] Proxy Invokes Original', baseTime}, () => {
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

doTest({n, label: '[X] Decorated [X] Uses Proxy Constructor [X] Proxy Invokes Original', baseTime}, () => {
  return new ProxyInvokingDecoratedClass();
});
