// SSR Polyfills for server-side rendering
// This file provides polyfills for browser-only globals when running on the server

if (typeof global !== 'undefined') {
  // Server-side environment
  if (typeof global.self === 'undefined') {
    global.self = global
  }
  
  if (typeof global.window === 'undefined') {
    global.window = global
  }
  
  if (typeof global.document === 'undefined') {
    global.document = {
      createElement: () => ({}),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    } as any
  }
  
  if (typeof global.navigator === 'undefined') {
    global.navigator = {
      userAgent: 'Node.js',
    } as any
  }
  
  if (typeof global.location === 'undefined') {
    global.location = {
      href: '',
      origin: '',
      protocol: 'https:',
      host: '',
      hostname: '',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
    } as any
  }
  
  if (typeof global.history === 'undefined') {
    global.history = {
      pushState: () => {},
      replaceState: () => {},
      go: () => {},
      back: () => {},
      forward: () => {},
    } as any
  }
  
  if (typeof global.localStorage === 'undefined') {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as any
  }
  
  if (typeof global.sessionStorage === 'undefined') {
    global.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as any
  }
}
