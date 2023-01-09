import * as React from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { Button, Portal, Text, Chip, IconButton, Surface, Title} from 'react-native-paper';

import {SECTION_NAME, hadithSectionListOf, pushFilterReadyFormat, deleteFromFilterReadyFormat} from '@data';

const TitledItem = ({item, index, onPress}) => {
    const [isSelected, setIsSelected] = React.useState(false);
    const {colors} = useAppTheme();

    const styles = makeStyles(colors);

    return (
        <View style={styles.itemContainerStyle}>
            <Chip style={styles.itemStyle} key={index} 
                    mode="flat"
                    elevation="2"
                    onPress={() => {
                        setIsSelected(!isSelected);
                        onPress(item, index, !isSelected);
                    }}>
                <Title>{index+1}.  {item[SECTION_NAME]}</Title>
            </Chip>
        </View>);
}

export const SectionsSurface = ({onDismiss, containerStyle, book}) => {
    const {colors} = useAppTheme();
    const books = hadithSectionListOf(book);
    const [selectedItems, setSelectedItems] = React.useState(new Array(books.length).fill(false));

    const styles = makeStyles(colors);
    let checkedItems = {};

    const onDismissModal = () => {
        onDismiss(checkedItems);
    };

    if (!containerStyle) {
        containerStyle = {}
    }
    
    const onCheckedItem = (item, index, isSelected) => {
        //console.debug({isSelected});
        if (isSelected) {
            checkedItems = pushFilterReadyFormat(checkedItems, book, index+1, item);
        } else {
            deleteFromFilterReadyFormat(checkedItems, book, index+1);
        }
        //console.debug({checkedItems});
    };

    const renderTitles = (v) => {
        return <TitledItem {...v} onPress={onCheckedItem} />
    }

 return (
    <Surface 
        onDismiss={onDismissModal} 
        style={[styles.containerStyle]}>
            <FlatList
                style={{width:'100%'}}
                data={books}
                keyExtractor={(item, i) => i}
                renderItem={renderTitles}
            />
    </Surface>
  );
};


const makeStyles = (colors) => StyleSheet.create({
    containerStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    itemContainerStyle: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingLeft: 20, 
        paddingRight: 20, 
        paddingTop:5
    },
    itemContainerSelectedStyle: {
        backgroundColor: "rgba(0, 110, 0, 0.1)"
    },
    itemStyle: {
        flex: 1,
        width: '90%',
        margin:5
    },
    checkbox: {
    }
});