import * as React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Text, Checkbox, IconButton, Surface} from 'react-native-paper';

import {SECTION_NAME, hadithSectionListOf, pushFilterReadyFormat, deleteFromFilterReadyFormat} from '@data';

const TitledItem = ({item, index, onPress}) => {
    const [isSelected, setIsSelected] = React.useState(false);

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
        <Text style={styles.itemStyle} key={index}>{index+1}.  {item[SECTION_NAME]}</Text>
    </Surface>);
}

export const SectionsModal = ({visible, onDismiss, containerStyle}) => {
    const {colors} = useAppTheme();
    const book = 'bukhari'
    const books = hadithSectionListOf(book);
    const [selectedItems, setSelectedItems] = React.useState(new Array(books.length).fill(false));

    let checkedItems = {[book]: {}};

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
    <Portal style={{alignItems: 'center'}}>
        <Modal 
            visible={visible} 
            onDismiss={onDismissModal} 
            contentContainerStyle={containerStyle} 
            style={{height: '100%'}}>
            <Surface style={styles.modalViewContainerStyle}>
                <Surface elevation="3" style={{flexDirection:'row', backgroundColor: colors.primary, padding:0, margin:0}}>
                    <Text style={[styles.titleStyle, {flex: 1, textAlign: 'center'}]}>{book} Sections</Text>
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


const styles = StyleSheet.create({
    modalViewContainerStyle: {
        height: '100%', 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 2
    },
    titleStyle: {
        fontSize: 18,
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
    },
    itemStyle: {
        width: '90%'
    },
    checkbox: {
    }
});