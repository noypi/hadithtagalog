import * as React from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { Button, Portal, Text, Chip, IconButton, Surface, Title } from 'react-native-paper';

import { hadithSectionOffsets, hadithSectionNameOf, pushFilterReadyFormat } from '@data/';
import { useAppStore } from '@stores/app';
import { watch } from '@lib/';

const TitledItem = ({ item, index, onPress, book }) => {
    const $C = () => (
        <View style={styles.itemContainerStyle}>
            <Chip style={styles.itemStyle} key={index}
                mode="flat"
                elevation={2}
                onPress={() => {
                    setIsSelected(!isSelected);
                    onPress(item, index, !isSelected);
                }}>
                <Title>{index + 1}.  {hadithSectionNameOf(book, index + 1)}</Title>
            </Chip>
        </View>
    );

    const [isSelected, setIsSelected] = React.useState(false);
    const { $colors } = useAppStore();
    const styles = watch($colors, v => makeStyles($colors));

    return $C();
}

export const SectionsSurface = ({ onPressItem, containerStyle, book }) => {
    const $C = () => (
        <Surface
            style={[styles.containerStyle]}>
            <FlatList
                style={{ width: '100%' }}
                data={bookSections}
                keyExtractor={(item, i) => i}
                renderItem={renderTitles}
            />
        </Surface>
    );

    const { $colors } = useAppStore();
    const styles = watch($colors, v => makeStyles($colors));

    const bookSections = hadithSectionOffsets(book);
    const [selectedItems, setSelectedItems] = React.useState(new Array(bookSections.length).fill(false));

    let checkedItems = {};

    if (!containerStyle) {
        containerStyle = {}
    }

    const onPressItemLocal = (item, index, isSelected) => {
        //console.debug({isSelected});
        onPressItem(pushFilterReadyFormat(checkedItems, book, index + 1, item));
        //console.debug({checkedItems});
    };

    const renderTitles = (v) => {
        return <TitledItem {...v} book={book} onPress={onPressItemLocal} />
    }

    return $C();
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
        paddingTop: 5
    },
    itemContainerSelectedStyle: {
        backgroundColor: "rgba(0, 110, 0, 0.1)"
    },
    itemStyle: {
        flex: 1,
        width: '90%',
        margin: 5
    },
    checkbox: {
    }
});