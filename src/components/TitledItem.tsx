import React from "react";
import { hadithSectionNameOf } from "@data/";
import { useAppStore } from "@stores/app";
import { Checkbox, Surface, Text } from "react-native-paper";
import { watch } from "@lib";

export const TitledItem = ({ item, index, onPress, book, styles }) => {
    const $C = () => (<Surface style={isSelected ? backSelected : backNotSelected} elevation={2}>
        <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => {
                setIsSelected(!isSelected);
                onPress(item, index, !isSelected);
            }}
            styles={styles}
        />
        <Text style={styles.itemStyle} key={index}>{index + 1}.  {hadithSectionNameOf(book, index + 1)}</Text>
    </Surface>);

    const [isSelected, setIsSelected] = React.useState(false);

    const backSelected = [styles.itemContainerStyle, styles.itemContainerSelectedStyle];
    const backNotSelected = styles.itemContainerStyle;

    return $C();
}