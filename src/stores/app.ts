import { Appearance } from "react-native";
import { action, computed, observable } from "mobx";
import { greenTheme, greenDarkTheme } from '@data/theme';
import { useEffect, useState } from "react";
import { computed_property } from "@lib";

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
    return {
        $colors: computed_property(store.theme.colors),
        $theme: computed_property(store.theme)
    };
}
