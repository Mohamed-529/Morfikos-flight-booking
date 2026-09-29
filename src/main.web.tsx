import { AppRegistry } from 'react-native-web';
import App from './App';

// Register the app with React Native Web
AppRegistry.registerComponent('App', () => App);

const rootTag = document.getElementById('root');
if (rootTag) {
  AppRegistry.runApplication('App', {
    initialProps: {},
    rootTag: rootTag as any,
  });
}
