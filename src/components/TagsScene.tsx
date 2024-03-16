import { watch } from '@lib';
import { useAppStore } from '@stores/app';
import { useLocaleStore } from '@stores/locale';
import * as React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Text, Checkbox, IconButton, Surface, Title, TextInput, Chip, Button } from 'react-native-paper';


const TitledItem = ({ item, index, onPress, checked, onDeleteTag }) => {
    const $C = () => (<Surface className="" style={isSelected ? backSelected : backNotSelected} elevation={2}>
        <Chip style={{ width: '82%' }} key={index}
            className="ml-4 py-2"
            mode="flat"
            elevation={2}
            onPress={() => {
                setIsSelected(!isSelected);
                onPress(item, index, !isSelected);
            }}>
            <Text key={index}>{item}</Text>
        </Chip>

        {!onDeleteTag ? null : <IconButton className="" icon="trash-can-outline" size={24} onPress={() => onDeleteTag(item)} />}
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

export const TagsScene = ({ title, tags, visible, onDismiss, onAddTag, containerStyle, hadithId, hadithTags, onToggleItem, onDeleteTag }) => {
    const $C = () => (
        <Surface style={styles.modalViewContainerStyle}>
            <Surface style={styles.inputContainerStyle}>
                <TextInput
                    onSubmitEditing={onAddTagLocal}
                    onChangeText={setInputValue}
                    label={$tk.TAG_INPUT_NEW_LABEL}
                    placeholder={$tk.TAG_INPUT_NEW_PLACEHOLDER}
                    style={styles.inputTagStyle}
                    right={<TextInput.Icon icon="playlist-plus" onPress={onAddTagLocal} />}
                />
            </Surface>

            <TagsList />
        </Surface>
    );

    const [inputValue, setInputValue] = React.useState("");
    const { $colors } = useAppStore();
    const { $tk } = useLocaleStore();

    const styles = watch($colors, v => makeStyles($colors));

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
        onDismissModal();
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