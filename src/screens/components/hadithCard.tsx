import * as React from 'react';
import {StyleSheet} from 'react-native';
import { Avatar, Button, Card, Title, Paragraph, IconButton, Text, Chip } from 'react-native-paper';
import HighlightText from '@sanar/react-native-highlight-text';


const LeftContent = props => <Avatar.Icon {...props} icon="folder" />

export const HadithCard = ({title, subtitle, content, cardTitle, highlights, onPressFavorite}) => {
  return (<Card>
    <Card.Title title={title} subtitle={subtitle} left={LeftContent} />
    <Card.Content>
      <Title>{cardTitle}</Title>
      <Paragraph style={styles.paragraph}>
        <HighlightText
            highlightStyle={styles.highlighted}
            searchWords={highlights.filter(v => (/^[a-z0-9]+$/i).test(v))}
            textToHighlight={content}
            />
      </Paragraph>
    </Card.Content>
    <Card.Actions>
        <Chip icon="star-plus-outline" onPress={onPressFavorite} mode="flat" elevated="2">Paborito</Chip>
        <IconButton icon="star-plus-outline" />
        <Button>Ok</Button>
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