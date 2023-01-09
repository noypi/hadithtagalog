import * as React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Text, Checkbox, IconButton, Surface, Title, TextInput} from 'react-native-paper';


const TitledItem = ({item, index, onPress, checked, onDeleteTag}) => {
    const [isSelected, setIsSelected] = React.useState(checked);
    const {colors} = useAppTheme();

    //item = item.item;

    const styles = makeStyles(colors);

    const textStyle = !onDeleteTag ? [styles.itemStyle, {width: '80%'}] : styles.itemStyle;

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
        <Text style={textStyle} key={index}>{item}</Text>
        {!onDeleteTag? null : <IconButton icon="trash-can-outline" size={18} onPress={() => onDeleteTag(item)}/>}
    </Surface>);
}

export const TagsModal = ({title, tags, visible, onDismiss, onAddTag, containerStyle, hadithId, hadithTags, onToggleItem, onDeleteTag}) => {
    const [inputValue, setInputValue] = React.useState("");
    const {colors} = useAppTheme();
    const [selectedItems, setSelectedItems] = React.useState(new Array(tags.length).fill(false));

    const styles = makeStyles(colors);
    let checkedItems = hadithTags?.reduce((prev, curr) => {
        prev[curr] = true;
        return prev;
    }, {}) ?? [];

    const onDismissModal = () => {
        console.debug("checkedItems", {checkedItems});
        let selected = Object.keys(checkedItems);
        console.debug("onDismissModal", {selected});
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
        if (inputValue.length == 0) {return}
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

 return (
    <Portal style={{alignItems: 'center'}}>
        <Modal 
            visible={visible} 
            onDismiss={onDismissModal} 
            contentContainerStyle={containerStyle} 
            style={{height: '100%'}}>
            <Surface style={styles.modalViewContainerStyle}>
                <Surface elevation="3" style={styles.titleContainerStyle}>
                    <Title style={[styles.titleStyle, {flex: 1, textAlign: 'center'}]}>{title}</Title>
                    <IconButton style={{backgroundColor: 'white', color: colors.primary}} 
                            icon="check-outline"
                            onPress={onDismissModal} 
                            size={18}/>
                </Surface>

                {!hadithId ? null : <TagsList />}
                
                <Surface style={styles.inputContainerStyle}>
                    <TextInput
                        onSubmitEditing={onAddTagLocal}
                        onChangeText={setInputValue}
                        value={inputValue}
                        label="Bagong Tag"
                        placeholder="Gumawa ng bagong Tag"
                        placeholderTextColor="rgba(84, 99, 77, 0.65)"
                        mode="flat"
                        styles={styles.inputTagStyle}
                        right={<TextInput.Icon icon="tag-plus" onPress={onAddTagLocal}/>}
                        />
                </Surface>

                {!hadithId ? <TagsList /> : null}
            </Surface>
        </Modal>
    </Portal>
  );
};


const makeStyles = (colors) => StyleSheet.create({
    inputTagStyle: {
    },
    inputContainerStyle: {
        marginBottom: 15
    },
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
        margin:0,
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