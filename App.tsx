import React from 'react';
import {Provider} from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {LocaleProvider} from '@data/locale';

import "./src/init";
import {DrawerScreen, ReadMoreScreen} from '@screens';

const Stack = createNativeStackNavigator();
export default function App() {
    const [theme, setTheme] = React.useState(useAppTheme());
    const {colors} = theme;
    
    //console.debug({colorsPrimary:theme.colors.primary});
    return (
      <Provider theme={theme}><LocaleProvider>
        <NavigationContainer>
            <Stack.Navigator id="MainStackNavigator">
                <Stack.Screen name="Drawer" component={DrawerScreen} options={{headerShown: false}} />
                <Stack.Screen name="ReadMore" component={ReadMoreScreen} options={{
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTintColor: colors.onBackground,
                    headerTitleStyle: {
                        color: colors.onBackground
                    }
                }}/>
            </Stack.Navigator>
        </NavigationContainer>
      </LocaleProvider></Provider>
    );
  }
