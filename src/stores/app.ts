import { Appearance } from "react-native";
import { action, computed, observable } from "mobx";
import { greenTheme, greenDarkTheme } from '@data/theme';
import { useEffect, useState } from "react";

class AppStore {
    @computed get theme() {
        return this.is_dark
            ? greenDarkTheme
            : greenTheme;
    }

    @computed get is_dark() {
        return Appearance.getColorScheme() == 'dark';
    };

}

const store = new AppStore();
export default store;

export function useAppStore() {
    const [$colors, setColors] = useState(store.theme.colors);
    const [$theme, setTheme] = useState(store.theme);

    useEffect(() => {
        setColors(store.theme.colors);
        setTheme(store.theme);

    }, [store.theme]);

    return {
        $colors,
        $theme
    };
}
