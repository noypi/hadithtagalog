import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import { Avatar, Button, Card, Title, Paragraph, IconButton, Text, Chip, Surface } from 'react-native-paper';
import {HighlightText} from './highlightText';

const TextComponent = ({children}) => {
    const {colors} = useAppTheme();
    const styles = makeStyles(colors);
    return (<Text 
                 style={styles.normalText}
                 variant="bodyMedium">{children}</Text>)
}

const HighlightComponent = ({children}) => {
    const {colors} = useAppTheme();
    const styles = makeStyles(colors);
    return (<Text
                style={styles.highlighted} 
                variant="bodyMedium">{children}</Text>)
}

const LeftContent = props => <Avatar.Icon {...props} icon="mosque" />

export const HadithCard = ({id, isFavorite, title, subtitle, content, cardTitle, highlights, onAddFavorite, onRemoveFavorite, onTagHadith}) => {
    const {colors} = useAppTheme();
    const styles = makeStyles(colors);
  return (<Card>
    <Card.Title title={title} subtitle={subtitle} left={LeftContent} />
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
    </Card.Content>
    <Card.Actions>
        {isFavorite ?
            (<IconButton icon="star-minus" iconColor="gold" mode="flat" onPress={() => onRemoveFavorite(id)} />) :
            (<Chip icon="star-plus-outline" onPress={() => onAddFavorite(id)} mode="flat" elevation="2">Paborito</Chip>)
        }
        <IconButton icon="tag-plus" iconColor={colors.primary} containerColor={colors.surface} onPress={() => onTagHadith(id)}/>
    </Card.Actions>
  </Card>)
};

const makeStyles = (colors) => StyleSheet.create({
    highlighted: {
        backgroundColor: 'yellow',
        color: 'black',
    },
    normalText: {
    },
    paragraph: {
    }
});