import React from 'react';
import { StyleSheet, FlatList, View, Linking } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { Searchbar, ActivityIndicator, Surface, Text, Menu, IconButton, SegmentedButtons, Title, Divider, Button, Switch, RadioButton } from 'react-native-paper';
import { hadithSectionInfoOf, bookNameOf } from '@data';
import { QUERY_STEP } from '@lib';

import { HomeScreen } from '@screens/home';

const Settings = () => {
    return null;
}

const DrawerContent = () => {
    return (<DrawerContentScrollView>
        <View>
            <Text style={{ color: 'red', justifyContent: 'center' }}>ok</Text>
        </View>
    </DrawerContentScrollView>);
}

const Drawer = createDrawerNavigator();

export const DrawerScreen = ({ navigation }) => {
    return (
        <Drawer.Navigator drawerContent={DrawerContent} screenOptions={{ header: () => null }}>
            <Drawer.Screen name="Home" component={HomeScreen} />
        </Drawer.Navigator>
    );
}