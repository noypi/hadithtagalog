import * as React from 'react';
import {StyleSheet} from 'react-native';
import { Avatar, Button, Card, Title, Paragraph, IconButton, Text, Chip } from 'react-native-paper';
import HighlightText from '@sanar/react-native-highlight-text';

const TextComponent = (props) => {
    return (<Text {...props} selectable={true} variant="bodyLarge"></Text>)
}

const LeftContent = props => <Avatar.Icon {...props} icon="mosque" />

export const HadithCard = ({id, isFavorite, title, subtitle, content, cardTitle, highlights, onAddFavorite, onRemoveFavorite, onTagHadith}) => {
    const {colors} = useAppTheme();
  return (<Card>
    <Card.Title title={title} subtitle={subtitle} left={LeftContent} />
    <Card.Content>
      <Title>{cardTitle}</Title>
      <Paragraph style={styles.paragraph}>
        <HighlightText
            textComponent={TextComponent}
            highlightStyle={styles.highlighted}
            searchWords={highlights.filter(v => (/^[a-z0-9]+$/i).test(v))}
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

const styles = StyleSheet.create({
    highlighted: {
      backgroundColor: 'yellow'
    },
    paragraph: {
        fontSize: 16
    }
});