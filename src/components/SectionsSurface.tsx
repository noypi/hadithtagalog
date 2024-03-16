import * as React from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { Button, Portal, Text, Chip, IconButton, Surface, Title, Divider } from 'react-native-paper';

import { hadithSectionOffsets, hadithSectionNameOf, pushFilterReadyFormat } from '@data/';
import { useAppStore } from '@stores/app';
import { watch } from '@lib/';

const TitledItem = ({ item, index, onPress, book }) => {
    const $C = () => (
        <Surface elevation={2} className="px-6">
            <Chip className="my-2"
                key={index}
                mode="flat"
                elevation={2}
                onPress={() => {
                    setIsSelected(!isSelected);
                    onPress(item, index, !isSelected);
                }}>
                <Title>{index + 1}.  {hadithSectionNameOf(book, index + 1)}</Title>
            </Chip>
        </Surface>
    );

    const [isSelected, setIsSelected] = React.useState(false);

    return $C();
}

export const SectionsSurface = ({ onPressItem, containerStyle, book }) => {
    const $C = () => (
        <Surface style={{ flex: 1 }} elevation={0}>
            <Surface style={{ flex: 1 }} elevation={0}>
                <FlatList
                    style={{ width: '100%' }}
                    data={bookSections}
                    keyExtractor={(item, i) => i}
                    renderItem={renderTitles}
                />
            </Surface>
            <Divider />
        </Surface>
    );

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

