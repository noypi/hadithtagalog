import React, { useEffect, useState } from 'react';
import { Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LocaleProvider } from '@data/locale';
import $app from '@stores/app';

import "src/init";
import { DrawerScreen, ReadMoreScreen } from '@screens/';

const Stack = createNativeStackNavigator();

export default function App() {
    const $screen = () => (
        <Provider theme={$app.theme}><LocaleProvider>
            <NavigationContainer>
                <Stack.Navigator id="MainStackNavigator">
                    <Stack.Screen name="Drawer" component={DrawerScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ReadMore" component={ReadMoreScreen} options={{
                        headerStyle: {
                            backgroundColor: $app.theme.colors.background,
                        },
                        headerTintColor: $app.theme.colors.onBackground,
                        headerTitleStyle: {
                            color: $app.theme.colors.onBackground
                        }
                    }} />
                </Stack.Navigator>
            </NavigationContainer>
        </LocaleProvider></Provider>
    );

    return $screen();
}
