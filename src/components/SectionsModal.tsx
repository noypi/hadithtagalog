import * as React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Text, Checkbox, IconButton, Surface, Title } from 'react-native-paper';

import { hadithSectionNameOf, hadithSectionOffsets, pushFilterReadyFormat, deleteFromFilterReadyFormat, bookNameOf } from '@data';
import $app, { useAppStore } from '@stores/app';
import $locale, { useLocaleStore } from '@stores/locale';
import { watch } from '@lib';
import { TitledItem } from './TitledItem';

export const SectionsModal = ({ visible, onDismiss, containerStyle, book }) => {
    const $C = () => (
        <Portal style={{ alignItems: 'center' }}>
            <Modal
                useNativeDriver={true}
                visible={visible}
                onDismiss={onDismissModal}
                contentContainerStyle={containerStyle}
                style={{ height: '100%' }}>
                <Surface style={styles.modalViewContainerStyle}>
                    <Surface elevation={3} style={styles.titleContainerStyle}>
                        <Title style={[styles.titleStyle, { flex: 1, textAlign: 'center' }]}>{$tk.CATEGORIES}{'\n'}{bookNameOf(book)}</Title>
                        <IconButton style={{ backgroundColor: 'white', color: $colors.primary }}
                            icon="check-outline"
                            onPress={onDismissModal}
                            size={18} />
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

    const { $colors } = useAppStore();
    const { $tk } = useLocaleStore();
    const books = hadithSectionOffsets(book);
    const [selectedItems, setSelectedItems] = React.useState(new Array(books.length).fill(false));

    const styles = watch($colors, v => makeStyles(v));
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
            checkedItems = pushFilterReadyFormat(checkedItems, book, index + 1, item);
        } else {
            deleteFromFilterReadyFormat(checkedItems, book, index + 1);
        }
        //console.debug({checkedItems});
    };

    const renderTitles = (v) => {
        return <TitledItem {...v} book={book} onPress={onCheckedItem} styles={styles} />
    }

    return $C();
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
        flexDirection: 'row',
        backgroundColor: colors.primaryContainer,
        padding: 0,
        margin: 0
    }
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