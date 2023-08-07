import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import HomeScreen from './screens/HomeScreen';
import RoomScreen from './screens/RoomScreen';

const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator initialRouteName="HomeScreen">
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="RoomScreen" component={RoomScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}