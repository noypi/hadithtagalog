import * as React from 'react';
import { StyleSheet, View, ToastAndroid } from 'react-native';
import { Avatar, Button, Card, Title, Paragraph, IconButton, Text, Chip, Surface } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { gradesRating, gradesOf } from '@data/';
import { HighlightText } from './HighlightText';
import { split_hadith_id, watch } from '@lib/';
import { useAppStore } from '@stores/app';
import { useLocaleStore } from '@stores/locale';

const TextComponent = ({ children }) => {
    const { $colors } = useAppStore();
    const styles = watch($colors, v => makeStyles($colors));
    return (<Text
        style={styles.normalText}
        variant="bodyLarge">{children}</Text>)
}

const HighlightComponent = ({ children }) => {
    const { $colors } = useAppStore();
    const styles = watch($colors, v => makeStyles($colors));

    return (<Text
        style={styles.highlighted}
        variant="bodyMedium">{children}</Text>)
}

export const HadithCard = ({ id, isFavorite, title, subtitle, content, cardTitle, highlights, onAddFavorite, onRemoveFavorite, onTagHadith }) => {
    const $C = () => (<Card style={[rating < 0 ? styles.daifStyle : {}]}>
        <Card.Title title={title} subtitle={subtitle} left={(LeftContent)} />
        <Card.Content>
            <Title>{cardTitle}</Title>
            <Paragraph>
                <HighlightText
                    textComponent={TextComponent}
                    highlightComponent={HighlightComponent}
                    highlightStyle={styles.highlighted}
                    searchWords={highlights}
                    textToHighlight={content}
                />
            </Paragraph>
            <View style={{ marginTop: 10 }}>
                {grades.map((g, i) => (
                    <Text key={i}>- {g.grade} {g.name.length > 0 ? `(${g.name})` : ''}</Text>
                ))
                }
            </View>
        </Card.Content>
        <Card.Actions>
            <IconButton icon="page-next-outline"
                iconColor={$colors.primary}
                containerColor={$colors.surface}
                onPress={() => navigation.getParent('MainStackNavigator').navigate('ReadMore', { id, content, title: cardTitle, bookref: subtitle, isFavorite })} />

            <IconButton icon="content-copy"
                iconColor={$colors.primary}
                containerColor={$colors.surface}
                onPress={async () => {
                    await Clipboard.setStringAsync(`${cardTitle}:\n${content}\n\n${subtitle}`);
                    ToastAndroid.show($tk.TOAST_COPIED, ToastAndroid.SHORT);
                }} />

            <IconButton icon="tag-plus" iconColor={$colors.primary} containerColor={$colors.surface} onPress={() => onTagHadith(id)} />

            {isFavorite ?
                (<IconButton icon="star-minus" iconColor="gold" mode="flat" onPress={() => onRemoveFavorite(id)} />) :
                (<Chip icon="star-plus-outline" onPress={() => onAddFavorite(id)} mode="flat" elevation={2}>{$tk.SEGBUTTONS_FAVORITES}</Chip>)
            }
        </Card.Actions>
    </Card>)

    const { $colors } = useAppStore();
    const styles = watch($colors, v => makeStyles($colors));
    const { $tk } = useLocaleStore();

    const navigation = useNavigation();
    const [book, idint] = split_hadith_id(id);

    const grades = gradesOf(book, idint);
    const rating = gradesRating(grades);

    let icon = "mosque";
    let iconColor = $colors.primaryContainer;
    let iconBackgroundColor = $colors.primary;
    if (rating < -6) {
        icon = "alert-circle-outline";
        iconColor = $colors.error;
        iconBackgroundColor = $colors.onError;
    } else if (rating < 0) {
        icon = "close-octagon-outline";
        iconColor = $colors.error;
        iconBackgroundColor = $colors.onError;
    }

    const LeftContent = props => <Avatar.Icon {...props} icon={icon} color={iconColor} style={{ backgroundColor: iconBackgroundColor }} />

    return $C();
};

const makeStyles = (colors) => StyleSheet.create({
    daifStyle: {
        backgroundColor: colors.errorContainer,
        color: colors.error
    },
    rowContainer: {
        flexDirection: 'row',
    },
    highlighted: {
        backgroundColor: 'yellow',
        color: 'black',
    },
    cardActionStyle: {
    },
    normalText: {
    },
    paragraph: {
    }
});