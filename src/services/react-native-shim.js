import * as RNWeb from 'react-native-web';

export * from 'react-native-web';

export const TurboModuleRegistry = {
  getEnforcing: (name) => ({}),
  get: (name) => null,
};

export const codegenNativeComponent = (name, options) => {
  return RNWeb.View;
};

export const codegenNativeCommands = (options) => ({});

const RN = {
  ...RNWeb,
  TurboModuleRegistry,
  codegenNativeComponent,
  codegenNativeCommands,
};

export default RN;
