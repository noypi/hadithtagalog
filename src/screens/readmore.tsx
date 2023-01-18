import React from 'react';
import {StyleSheet,  View, Text as RNText, ToastAndroid, ScrollView} from 'react-native';
import { Surface, Text, Portal, IconButton, SegmentedButtons, Chip, Button, Switch } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';

import {ScreenWrapper} from './screenwrapper';
import { splitHadithId } from '../lib/data';


export const ReadMoreScreen = ({navigation, route}) => {
    navigation.setOptions({title: $SCREEN_READMORE_TITLE});
    const {colors} = useAppTheme();
    const [isFavorite, setIsFavorite] = React.useState(route.params.isFavorite);
    const [currLocale, setCurrLocale] = React.useState($$LOCALE);
    const {content, title, bookref, id} = route.params;

    const [book, idint] = splitHadithId(id);
    const isFil = () => currLocale == 'fil';
    const otherLocale = ($$LOCALE == 'fil') ? 'eng' : 'fil'; // when 'fil', otherLocale is 'eng'
    const defLocaleData = {
        content, title, bookref, isFavorite
    }

    const [translation, setTranslation] = React.useState(defLocaleData);
    const [otherLocaleData, setOtherLocaleData] = React.useState({content: "", title: "", isFavorite: false, bookref: ""});

    const onTranslationChanged = (t) => {
        console.debug("onTranslationChanged", {t});
        const nextTransData = (t == otherLocale) ? otherLocaleData : defLocaleData;
        //console.debug({nextTransData});
        setTranslation(nextTransData);
        setCurrLocale(t);
    };

    React.useEffect(() => {
        //console.debug("ReadMoreScreen", {otherLocale});
        $$db?.getByID(id, otherLocale).then(v => {
            console.debug("getByID result =>", {v});
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
            <View flex={1}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding:15}}>
                    <Switch value={currLocale == 'fil'} onValueChange={(b) => onTranslationChanged(b ? 'fil' : 'eng')} />
                    <Text>{currLocale == 'fil' ? 'Filipino' : 'English'}</Text>
                </View>
            </View>
            <Surface elevation="3" flex={15} style={{margin:15}}>
                <ScrollView style={{height: '75%', padding: 10}} >
                    <Text selectable={true} variant="bodyLarge">
                        <Text variant="titleLarge">{translation?.title ?? ""}</Text>
                        <Text variant="titleMedium">{'\n'+translation?.bookref ?? ""+'\n\n'}</Text>
                        {translation?.content ?? ""}
                    </Text>
                </ScrollView>
            </Surface>
            <View flex={3} style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15, marginRight: 20, marginTop: 10}}>
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