import React from 'react';
import { StyleSheet, View, Text as RNText, ToastAndroid, ScrollView } from 'react-native';
import { Surface, Text, Portal, IconButton, SegmentedButtons, Chip, Button, Switch } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';

import { ScreenWrapper } from './screenwrapper';


export const ReadMoreScreen = ({ navigation, route }) => {
    navigation.setOptions({ title: $SCREEN_READMORE_TITLE });
    const { colors } = useAppTheme();
    const styles = makeStyles(colors);
    const [isFavorite, setIsFavorite] = React.useState(route.params.isFavorite);

    // this currLocale is only for this screen, NOT to configure globally
    const [currLocale, setCurrLocale] = React.useState($$LOCALE);
    const { content, title, bookref, id } = route.params;

    const [book, idint] = split_hadith_id(id);
    const otherLocale = ($$LOCALE == 'ara') ? 'eng' : 'ara'; // when 'ara', otherLocale is 'eng'
    const defLocaleData = {
        content, title, bookref, isFavorite
    }

    const [translation, setTranslation] = React.useState(defLocaleData);
    const [otherLocaleData, setOtherLocaleData] = React.useState({ content: "", title: "", isFavorite: false, bookref: "" });

    const onTranslationChanged = (t) => {
        console.debug("onTranslationChanged", { t });
        const nextTransData = (t == otherLocale) ? otherLocaleData : defLocaleData;
        //console.debug({nextTransData});
        setTranslation(nextTransData);
        setCurrLocale(t);
    };

    React.useEffect(() => {
        //console.debug("ReadMoreScreen", {otherLocale});
        $$db?.getByID(id, otherLocale).then(v => {
            console.debug("getByID result =>", { v });
            const atColon = v.content.indexOf(":");
            const title = (atColon > 0) ? v.content.slice(0, atColon) : "";
            const content = v.content.slice(v.content.indexOf(":") + 1);
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20 }}>
                    <Text flex={5} variant="titleMedium">{translation?.bookref ?? ""}</Text>
                    <View flex={3} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 15 }}>
                        <Switch value={currLocale == 'ara'} onValueChange={(b) => onTranslationChanged(b ? 'ara' : 'eng')} />
                        <Text>{currLocale == 'ara' ? 'Arabic' : 'English'}</Text>
                    </View>
                </View>
            </View>
            <Surface elevation="3" flex={15} style={styles.contentContainerStyle}>
                <ScrollView style={styles.scrollViewStyle} >
                    <Text selectable={true} variant="bodyLarge">
                        <Text variant="titleLarge">{translation?.title ?? ""}</Text>
                        {'\n' + translation?.content ?? ""}
                        {
                            "\n\n"// issue #14 - clipped text at bottom
                        }
                    </Text>
                </ScrollView>
            </Surface>
            <View flex={3} style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15, marginRight: 20 }}>
                <IconButton icon="content-copy"
                    iconColor={colors.primary}
                    containerColor={colors.surface}
                    onPress={async () => {
                        await Clipboard.setStringAsync(`${translation.title}:\n${translation.content}\n\n${translation.bookref}`);
                        ToastAndroid.show($TOAST_COPIED, ToastAndroid.SHORT);
                    }} />
            </View>
        </ScreenWrapper>
    );
}

const makeStyles = colors => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollViewStyle: {
        padding: 10,
    },
    contentContainerStyle: {
        margin: 15,
        marginBottom: 0
    }
});