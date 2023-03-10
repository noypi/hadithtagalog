import * as React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Text, Checkbox, IconButton, Surface, Title} from 'react-native-paper';

import {hadithSectionNameOf, hadithSectionOffsets, pushFilterReadyFormat, deleteFromFilterReadyFormat, bookNameOf} from '@data';

const TitledItem = ({item, index, onPress, book}) => {
    const [isSelected, setIsSelected] = React.useState(false);
    const {colors} = useAppTheme();

    const styles = makeStyles(colors);

    const backSelected = [styles.itemContainerStyle, styles.itemContainerSelectedStyle];
    const backNotSelected = styles.itemContainerStyle;

    return (<Surface style={isSelected ? backSelected : backNotSelected} elevation="2">
            <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => {
                    setIsSelected(!isSelected);
                    onPress(item, index, !isSelected);
                }}
                styles={styles.checkbox}
            />
        <Text style={styles.itemStyle} key={index}>{index+1}.  {hadithSectionNameOf(book, index+1)}</Text>
    </Surface>);
}

export const SectionsModal = ({visible, onDismiss, containerStyle, book}) => {
    const {colors} = useAppTheme();
    const books = hadithSectionOffsets(book);
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
        return <TitledItem {...v} book={book} onPress={onCheckedItem} />
    }

 return (
    <Portal style={{alignItems: 'center'}}>
        <Modal 
            useNativeDriver={true}
            visible={visible} 
            onDismiss={onDismissModal} 
            contentContainerStyle={containerStyle} 
            style={{height: '100%'}}>
            <Surface style={styles.modalViewContainerStyle}>
                <Surface elevation="3" style={styles.titleContainerStyle}>
                    <Title style={[styles.titleStyle, {flex: 1, textAlign: 'center'}]}>{$CATEGORIES}{'\n'}{bookNameOf(book)}</Title>
                    <IconButton style={{backgroundColor: 'white', color: colors.primary}} 
                            icon="check-outline"
                            onPress={onDismissModal} 
                            size={18}/>
                </Surface>
                <FlatList
                    data={books}
                    keyExtractor={(item, i) => i}
                    renderItem={renderTitles}
                />
            </Surface>
        </Modal>
    </Portal>
  );
};


const makeStyles = (colors) => StyleSheet.create({
    modalViewContainerStyle: {
        height: '100%', 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 2
    },
    titleContainerStyle: {
        flexDirection:'row', 
        backgroundColor: colors.primaryContainer, 
        padding:0, 
        margin:0}
    ,
    titleStyle: {
        marginBottom: 10,
        marginTop: 10
    },
    itemContainerStyle: {
        flexDirection: 'row', 
        alignItems: 'center',
        paddingBottom: 8,
        paddingTop: 8,
        paddingLeft: 2,
        paddingRight: 15
    },
    itemContainerSelectedStyle: {
        backgroundColor: "rgba(0, 110, 0, 0.1)"
    },
    itemStyle: {
        width: '90%'
    },
    checkbox: {
    }
});