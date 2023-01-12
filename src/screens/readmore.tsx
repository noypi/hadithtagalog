import React from 'react';
import {StyleSheet,  View, Text as RNText, ToastAndroid, ScrollView} from 'react-native';
import { Surface, Text, Portal, IconButton, SegmentedButtons, Chip, Button, Switch } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';

import {ScreenWrapper} from './screenwrapper';
import { splitHadithId } from '../lib/data';


export const ReadMoreScreen = ({navigation, route}) => {
    const {colors} = useAppTheme();
    const [isFavorite, setIsFavorite] = React.useState(route.params.isFavorite);
    const [readType, setReadType] = React.useState($$LOCALE);
    const {content, title, bookref, id} = route.params;

    const [book, idint] = splitHadithId(id);
    const otherLocale = ($$LOCALE == 'fil') ? 'eng' : 'fil';
    const defLocaleData = {
        content, title, bookref, isFavorite
    }

    const [translation, setTranslation] = React.useState(defLocaleData);
    const [otherLocaleData, setOtherLocaleData] = React.useState({content: "", title: "", isFavorite: false, bookref: ""});

    const currData = (t) => (t == otherLocale) ? otherLocaleData : defLocaleData;

    React.useEffect(() => {
        console.debug("ReadMoreScreen", {otherLocale});
        $$db?.getByID(id, otherLocale).then(v => {
            //console.debug("getByID result =>", {v});
            const atColon = v.content.indexOf(":");
            const title = (atColon>0) ? v.content.slice(0, atColon) : "";
            const content = v.content.slice(v.content.indexOf(":")+1); 
            setOtherLocaleData({
                content,
                title,
                isFavorite: !!v.favorite_id,
                bookref
            });
        })
    }, []);
    //console.debug("ReadMore", {params:route.params})
    //return null;
    return (
        <ScreenWrapper>
            <SegmentedButtons
                    value={readType}
                    onValueChange={t => {setReadType(t); setTranslation(currData(t))}}
                    buttons={[
                    { value: 'eng', label: $MENU_ENG, icon: 'alpha-e-box-outline', onPress: () => {}, showSelectedCheck: true},
                    { value: 'fil', label: $MENU_FIL, icon: 'glasses', onPress: () => {}, showSelectedCheck: true},
                    ]}
                />
            <Surface style={{padding: 15, paddingBottom:5}}>
                <ScrollView style={{height: '83%'}} >
                    <Text selectable={true} variant="bodyLarge" style={{marginTop: 20}}>
                        <Text variant="titleLarge">{translation.title}</Text>
                        <Text variant="titleMedium">{'\n'+translation.bookref+'\n\n'}</Text>
                        {translation.content}
                    </Text>
                </ScrollView>
            </Surface>
            <View flex={1} style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15, marginRight: 20, marginTop: 10}}>
                <IconButton icon="content-copy" 
                    iconColor={colors.primary} 
                    containerColor={colors.surface} 
                    onPress={() => {
                        Clipboard.setString(`${translation.title}:\n${translation.content}\n\n${translation.bookref}`);
                        ToastAndroid.show($TOAST_COPIED, ToastAndroid.SHORT);
                    }}/>
            </View>
        </ScreenWrapper>
    );
}