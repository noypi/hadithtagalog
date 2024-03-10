import { watch } from '@lib';
import { useAppStore } from '@stores/app';
import { useLocaleStore } from '@stores/locale';
import * as React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Text, Checkbox, IconButton, Surface, Title, TextInput, Linking, Button } from 'react-native-paper';


const TitledItem = ({ item, index, onPress, checked, onDeleteTag }) => {
    const $C = () => (<Surface style={isSelected ? backSelected : backNotSelected} elevation={2}>
        <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => {
                setIsSelected(!isSelected);
                onPress(item, index, !isSelected);
            }}
            styles={styles.checkbox}
        />
        <Text style={textStyle} key={index}>{item}</Text>
        {!onDeleteTag ? null : <IconButton icon="trash-can-outline" size={18} onPress={() => onDeleteTag(item)} />}
    </Surface>);

    const [isSelected, setIsSelected] = React.useState(checked);
    const { $colors } = useAppStore();
    const styles = watch($colors, v => makeStyles($colors));

    //item = item.item;

    const textStyle = !onDeleteTag ? [styles.itemStyle, { width: '80%' }] : styles.itemStyle;

    const backSelected = [styles.itemContainerStyle, styles.itemContainerSelectedStyle];
    const backNotSelected = styles.itemContainerStyle;

    return $C();
}

export const TagsModal = ({ title, tags, visible, onDismiss, onAddTag, containerStyle, hadithId, hadithTags, onToggleItem, onDeleteTag }) => {
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
                        <Title style={[styles.titleStyle, { flex: 1, textAlign: 'center' }]}>{title}</Title>
                        <IconButton style={{ backgroundColor: 'white', color: $colors.primary }}
                            icon="check-outline"
                            onPress={onDismissModal}
                            size={18} />
                    </Surface>

                    {!hadithId ? null : <TagsList />}

                    <Surface style={styles.inputContainerStyle}>
                        <TextInput
                            onSubmitEditing={onAddTagLocal}
                            onChangeText={setInputValue}
                            label={$tk.TAG_INPUT_NEW_LABEL}
                            placeholder={$tk.TAG_INPUT_NEW_PLACEHOLDER}
                            style={styles.inputTagStyle}
                            right={<TextInput.Icon icon="tag-plus" onPress={onAddTagLocal} />}
                        />
                    </Surface>

                    {!hadithId ? <TagsList /> : null}
                </Surface>
            </Modal>
        </Portal>
    );

    const [inputValue, setInputValue] = React.useState("");
    const { $colors } = useAppStore();
    const { $tk } = useLocaleStore();

    const styles = watch($colors, v => makeStyles($colors));

    const [selectedItems, setSelectedItems] = React.useState(new Array(tags.length).fill(false));

    let checkedItems = hadithTags?.reduce((prev, curr) => {
        prev[curr] = true;
        return prev;
    }, {}) ?? [];

    const onDismissModal = () => {
        console.debug("checkedItems", { checkedItems });
        let selected = Object.keys(checkedItems);
        console.debug("onDismissModal", { selected });
        onDismiss(selected, hadithId);
    };

    if (!containerStyle) {
        containerStyle = {}
    }

    const onCheckedItem = (item, index, isSelected) => {
        //console.debug("onCheckedItem", {item});
        if (isSelected) {
            checkedItems[item] = true;
        } else {
            delete checkedItems[item];
        }
        onToggleItem && onToggleItem(hadithId, item, isSelected);
        //console.debug({checkedItems});
    };

    const onAddTagLocal = () => {
        if (inputValue.length == 0) { return }
        onAddTag(inputValue);
    }

    const renderTitles = (v) => {
        return <TitledItem {...v} key={v.index}
            onDeleteTag={onDeleteTag}
            checked={!!checkedItems[v.item]}
            onPress={onCheckedItem} />
    }

    const TagsList = () => (
        <FlatList
            data={tags}
            keyExtractor={(item, i) => i}
            renderItem={renderTitles}
        />
    );

    return $C();
};


const makeStyles = (colors) => StyleSheet.create({
    inputTagStyle: {
    },
    inputContainerStyle: {
        marginBottom: 15,
        width: '90%'
    },
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
        margin: 0,
        marginBottom: 15
    },
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
        width: '70%'
    },
    checkbox: {
    }
});