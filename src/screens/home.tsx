import React, { useEffect, useMemo } from 'react';
import { StyleSheet, FlatList, View, Dimensions } from 'react-native';
import _ from 'lodash';
import { Searchbar, ActivityIndicator, Surface, Text, Menu, IconButton, SegmentedButtons, Title, Divider, Button, Switch, RadioButton, Icon } from 'react-native-paper';
import { hadithSectionInfoOf, bookNameOf, booksMap } from '@data/';
import { QUERY_STEP, ref, split_hadith_id, watch } from '@lib/';

import $app, { useAppStore } from '@stores/app';
import $locale, { useLocaleStore } from '@stores/locale';
import $hadiths from '@stores/hadiths';
import $db from '@stores/hadiths_db';

import SvgFlagPh from 'src/data/svg/ic_flag_ph.svg';
import SvgFlagUs from 'src/data/svg/ic_flag_us.svg';
//import SvgFlagSaudi from 'src/data/svg/ic_flag_saudi.svg';

import { ScreenWrapper } from '../components/screenwrapper';
import { HadithCard, SectionsModal, TagsModal, SectionsSurface, PopupDialog, TagsScene } from '../components';
import { useFlag } from 'src/composables/flag';


const CATEGORY = 'category';
const FAVORITES = 'favorites';
const TAGS = 'tags';

const FBGGROUP = 'https://web.facebook.com/groups/833486274413858';

export const HomeScreen = (options) => {
    const $screen = () => (
        <ScreenWrapper elevation={1} className="ma-0 pa-0">
            <Surface className="flex flex-1 flex-col h-screen" elevation={0}>
                <Surface className="flex" elevation={0}>
                    <Surface className="flex-row" elevation={0}>
                        <Searchbar
                            elevation={2}
                            className="mb-2 ml-4 flex-1"
                            placeholder={is_category_search ? $tk.SEARCH_CATEGORY_PLACEHOLDER : $tk.SEARCH_PLACEHOLDER}
                            onChangeText={query => search_query.value = query}
                            onIconPress={() => setTimeout(on_search)}
                            onSubmitEditing={() => setTimeout(on_search)}
                            value={search_query.value}
                            loading={searchingf.value}
                        />
                        <Surface className="items-end" style={{ width: 80 }} elevation={0}>
                            <View className="items-end content-end">
                                {flag_icon.value}
                            </View>
                            <View className="items-end">
                                <Text className="items-end pr-3">{$hadiths.count}/{$hadiths.total}</Text>
                            </View>
                        </Surface>
                    </Surface>

                    {(result_header_error.value.length > 0) ?
                        (<Surface elevation={4} style={[styles.resultHeader, styles.resultHeaderError]}>
                            <Title style={[styles.resultHeaderText, styles.resultHeaderTextError]}>{result_header_error.value}</Title>
                        </Surface>) : null
                    }
                </Surface>

                <Surface className="flex flex-grow" style={{ height: window_height - 182 }} elevation={0}>

                    {$hadiths.count
                        ? (<FlatList
                            data={['start', ...$hadiths.list, 'end']}
                            extraData={$locale.locale}
                            keyExtractor={(item) => `${$locale.locale}-${item?.id ?? item}`}
                            renderItem={render_hadith_card}
                            onEndReached={on_scroll_to_end}
                            onEndReachedThreshold={1}
                        />)
                        : is_tag_search
                            ? (<TagsScene
                                title={$tk.TAG_SEARCH_MODAL_TITLE}
                                visible={tags_modal_visible.value}
                                containerStyle={styles.modalContainer}
                                tags={known_tags.value}
                                onDeleteTag={onDeleteTag}
                                onAddTag={onNewTag}
                                onDismiss={onTagsSelected} />)
                            : (<SectionsSurface
                                containerStyle={styles.modalContainer}
                                book="bukhari"
                                onPressItem={onCategoriesSelected} />)
                    }
                </Surface>
                {/*
            <SectionsModal
                visible={section_modal_visible.value}
                containerStyle={styles.modalContainer}
                book="bukhari"
                onDismiss={onCategoriesSelected} />
        */}

                {/*
            <TagsModal
                title={$tk.TAG_SEARCH_MODAL_TITLE}
                visible={tags_modal_visible.value}
                containerStyle={styles.modalContainer}
                tags={known_tags.value}
                onDeleteTag={onDeleteTag}
                onAddTag={onNewTag}
                onDismiss={onTagsSelected} />
            <TagsModal
                title={$tk.TAG_MODAL_TITLE}
                visible={hadith_tag_modal_visible.value}
                containerStyle={styles.modalContainer}
                hadithId={hadith_id_to_tag.value}
                tags={known_tags.value}
                hadithTags={tags_of_hadith_id_to_tag.value}
                onAddTag={onNewTag}
                onDismiss={onHadithTagsSelected}
                onToggleItem={onToggleHadithTag} />
        */}

                <TagsModal
                    title={$tk.TAG_MODAL_TITLE}
                    visible={hadith_tag_modal_visible.value}
                    containerStyle={styles.modalContainer}
                    hadithId={hadith_id_to_tag.value}
                    tags={known_tags.value}
                    hadithTags={tags_of_hadith_id_to_tag.value}
                    onDeleteTag={onDeleteTag}
                    onAddTag={onNewTag}
                    onDismiss={onHadithTagsSelected}
                    onToggleItem={onToggleHadithTag} />

                <Surface className="flex px-2">
                    <SegmentedButtons
                        value={search_type.value}
                        onValueChange={v => search_type.value = (v === search_type.value ? '' : v)}
                        buttons={menu_buttons}
                    />

                </Surface>

            </Surface>
        </ScreenWrapper >
    );


    //navigation.setOptions({header: () => null});
    const { $theme, $colors } = useAppStore();
    const { $tk, $lang } = useLocaleStore();
    const styles = watch($colors, v => makeStyles(v));
    const window_height = Dimensions.get('window').height;

    const search_type = ref('');
    const search_query = ref('');
    const result_header = ref('');
    const result_header_error = ref('');

    const selected_categories = ref<any>([]);
    const searchingf = useFlag(false);
    const known_tags = ref([]);
    const favorites_local = ref<any>({});
    const highlighted_words = []; //watch(search_words, v => v);

    const section_modal_visible = ref(false);
    const tags_modal_visible = ref(false);
    const hadith_tag_modal_visible = ref(false);

    const is_light_mode = watch($app.is_dark, v => !v);
    const is_category_search = watch(search_type.value, v => v === CATEGORY);
    const is_favorite_search = watch(search_type.value, v => v === FAVORITES);
    const is_tag_search = watch(search_type.value, v => v === TAGS);
    const search_words = watch(search_query.value, v => v.split(' ').filter(word => word.trim().length > 0));
    const tags_of_hadith_id_to_tag = ref([]);
    const hadith_id_to_tag = ref('');

    const flag_icons = {
        //'ara': (<SvgFlagSaudi width={120} height={40} onPress={onPressedFlag} />),
        'fil': (<SvgFlagPh width={120} height={40} onPress={onPressedFlag} />),
        'eng': (<SvgFlagUs width={120} height={40} onPress={onPressedFlag} />),
    };

    const flag_icon = ref<any>(flag_icons[$locale.locale]);

    const menu_buttons = useMemo(() => [
        { value: CATEGORY, label: $tk.SEGBUTTONS_CATEGORY, icon: 'format-list-numbered', onPress: on_press_categories, showSelectedCheck: is_category_search },
        { value: FAVORITES, label: $tk.SEGBUTTONS_FAVORITES, icon: 'star-outline', onPress: on_press_favorites, showSelectedCheck: is_favorite_search },
        { value: TAGS, label: $tk.SEGBUTTONS_TAGS, icon: 'file-cabinet', onPress: on_press_tags, showSelectedCheck: is_tag_search },
    ], [search_type.value, $locale.locale]);

    async function onPressedFlag() {
        const langs = Object.keys(flag_icons);
        const index = langs.indexOf($locale.locale);
        $locale.set_locale(langs[index + 1] ?? langs[0]);
        flag_icon.value = flag_icons[$locale.locale];
        setTimeout(async () => await $hadiths.repeat_last_query());
    }

    watch($locale.locale, v => {
        $hadiths.reset();
        return false;
    });

    function onBeforePressSearchType() {
        result_header_error.value = '';
    };

    async function on_press_favorites() {
        onBeforePressSearchType();
        if (!is_favorite_search) {
            await searchingf.execute(async () => {
                await $hadiths.update_favorites();
                favorites_local.value = {};
            });

            if ($hadiths.count > 0) {
                result_header.value = $tk.SEARCH_FAVORITES_RESULT_MESSAGE;
            } else {
                result_header_error.value = $tk.SEARCH_FAVORITES_ZERO_RESULT_MESSAGE;
                search_type.value = '';
            }
        } else {
            $hadiths.reset();
            search_type.value = '';
        }
    }

    async function on_search() {
        console.debug('+-on_search()', { search_words, search_query: search_query.value });
        const words = search_words || [];
        result_header.value = '';
        result_header_error.value = '';

        if (_.includes(search_type.value, [FAVORITES, TAGS])) {
            search_type.value = ''; // fixes #16
        }

        let has_search_result = false;

        await searchingf.execute(async () => {
            let match_ids = words.filter(w => Number.isInteger(parseInt(w)));
            let match_books = words.map(w => w.toLowerCase()).filter(w => {
                // format <colon><bookname>
                return w.length > 1 && w.endsWith(':') && w.slice(0, -1) in booksMap
            }).map(w => w.slice(0, -1));
            let match_content = words.filter(w => {
                //remove any word beginning with ':'
                return !(w.length > 1 && w.endsWith(':'));
            }).join(' ');

            // match 
            //  - integer ids on search bar
            //  - hadith content
            //  - selected categories on search
            const totals = await $hadiths.search({ match_ids, match_content, match_books, selected: null });
            has_search_result = !!totals.search_total;
        });



        if ($hadiths.count > 0) {
            result_header.value = is_category_search
                ? has_search_result ? $tk.SEARCH_CATEGORIES_RESULT_MESSAGE : $tk.SEARCH_IDS_RESULT_MESSAGE
                : has_search_result ? $tk.SEARCH_RESULT_MESSAGE : $tk.SEARCH_IDS_RESULT_MESSAGE;

        } else {
            result_header_error.value = is_category_search
                ? $tk.SEARCH_WITH_CATEGORIES_ZERO_RESULT_MESSAGE
                : $tk.SEARCH_ZERO_RESULT_MESSAGE;;
        }
    }

    async function onCategoriesSelected(selected) {
        console.debug('+-onCategoriesSelected() =>', selected);
        result_header.value = '';
        result_header_error.value = '';

        section_modal_visible.value = false;
        selected_categories.value = selected;

        if (Object.keys(selected).length == 0) {
            result_header_error.value = $tk.SEARCH_CATEGORIES_ZERO_RESULT_MESSAGE;
            return;
        };

        await searchingf.execute(async () => {
            await $hadiths.update(selected);
        });

        if ($hadiths.count > 0) {
            result_header.value = $tk.SEARCH_CATEGORIES_RESULT_MESSAGE;
        } else {
            search_type.value = '';
            result_header_error.value = $tk.SEARCH_CATEGORIES_ZERO_RESULT_MESSAGE;
        }
    }

    function on_press_categories() {
        console.debug('onPressCategories', { search_type: search_type.value });
        onBeforePressSearchType();
        $hadiths.reset();
        search_type.value = '';
        selected_categories.value = {};
    }

    const updateKnownTags = async (sortfn?: (a: string, b: string) => number) => {
        let tags = await $db.get_tags();
        console.debug('updateKnownTags', { tags, sortfn });
        tags = tags.map(v => v.tag).sort();
        known_tags.value = sortfn ? tags.sort(sortfn) : tags;
    }

    async function on_press_tags() {
        console.log('onPressTags');
        $hadiths.reset();
        onBeforePressSearchType();
        if (!is_tag_search) {
            await updateKnownTags();
            tags_modal_visible.value = true;
        } else {
            $hadiths.reset();
            search_type.value = '';
        }
    }

    async function onToggleHadithTag(hadithId, tag, isSelected) {
        if (tag.length == 0) { return }

        isSelected ?
            await $db.add_hadith_tag(hadithId, tag) :
            await $db.remove_hadith_tag(hadithId, tag);
    }

    async function onHadithTagsSelected(selected) {
        hadith_tag_modal_visible.value = false;
    }

    async function onTagsSelected(selected) {
        console.debug('onTagsSelected', { selected });
        tags_modal_visible.value = false;

        if (selected.length == 0) {
            result_header_error.value = $tk.SEARCH_TAGS_ZERO_RESULT_MESSAGE;
            search_type.value = '';
            return
        }

        await searchingf.execute(async () => {
            await $hadiths.update_tagged(selected);
        });

        if ($hadiths.count > 0) {
            result_header.value = $tk.SEARCH_TAGS_RESULT_MESSAGE;
        } else {
            result_header_error.value = $tk.SEARCH_TAGS_ZERO_RESULT_MESSAGE;
        }
    }

    async function onDeleteTag(tag) {
        console.debug('onDeleteTag', { tag });
        await $db.del_tag_and_untag_hadiths(tag);
        await updateKnownTags();
    }

    async function onNewTag(tag) {
        console.debug('onNewTag', { tag });
        if (await $db.new_tag(tag)) {
            await updateKnownTags();
        } else {
            console.warn('tag not added');
        }
    }

    function render_hadith_start() {
        //console.log('renderHadithCardStart', {isResultGenDone});
        if (result_header.value.length > 0) {
            return (<Surface elevation={4} style={[styles.resultHeader]}><Title style={styles.resultHeaderText}>{result_header.value}</Title></Surface>);
        }
        return null;
    }

    function render_hadith_end() {
        //console.log('renderHadithCardEnd', {isResultGenDone});
        if (!$hadiths.done && $hadiths.count >= QUERY_STEP) {
            return (<ActivityIndicator animating={true} size="large" style={{ marginBottom: 40 }} />)
        }
        return null;
    }

    async function on_scroll_to_end() {
        console.debug('+onScrollToEnd')

        await searchingf.execute(async () => {
            console.debug('onScrollToEnd..');
            await $hadiths.load_more();
        });
    }

    function render_hadith_card(item) {
        item = item.item;

        if (item === 'start') { return render_hadith_start() }
        else if (item === 'end') { return render_hadith_end() }

        if (!item || !item.content) {
            return null;
        }
        //console.log('renderHadithCard => ', { item });
        const [book, id] = split_hadith_id(item.id);
        const text = item.content;
        const atColon = text.indexOf(':');
        const cardTitle = (atColon > 0) ? text.slice(0, atColon) : '';
        const content = text.slice(text.indexOf(':') + 1); // if atColon is -1 => then .slice(0) => original text
        const highlights = highlighted_words?.filter(v => (/^[a-z0-9]+$/i).test(v)) ?? [];
        const sectionInfo = book == 'bukhari' ? hadithSectionInfoOf(item.id) : { title: '', id: 0 };
        const is_favorite = _.get(favorites_local.value, item.id, !!item.favorite_id);
        const props = {
            onAddFavorite: on_add_favorite,
            onRemoveFavorite: on_remove_favorite,
            onTagHadith: on_show_tag_hadith_modal,
            isFavorite: is_favorite,
            id: item.id,
            highlights,
            cardTitle,
            title: `${sectionInfo.id}. ${sectionInfo.title}`,
            content,
            subtitle: `${bookNameOf(book)} (${id})`,
            extraData: !!favorites_local.value[item.id]
        }

        return (<HadithCard {...props} />);
    }

    async function on_add_favorite(id) {
        await $db.add_favorite(id);
        favorites_local.value = Object.assign({}, favorites_local.value, { [id]: true });
    }

    async function on_remove_favorite(id) {
        await $db.remove_favorite(id);
        favorites_local.value = Object.assign({}, favorites_local.value, { [id]: false });
    }

    async function on_show_tag_hadith_modal(id) {
        let tags: Array<string> = await $db.get_hadith_tags(id);
        console.debug('onShowTagHadithModal', { tags });
        // pass sortfn to place selected first in order
        await updateKnownTags((a: string, b: string) => tags.indexOf(a) < 0 ? 1 : tags.indexOf(b) < 0 ? -1 : a.localeCompare(b));
        tags_of_hadith_id_to_tag.value = tags;
        hadith_id_to_tag.value = id;
        hadith_tag_modal_visible.value = true;
    }


    return $screen();
};

const makeStyles = (colors) => StyleSheet.create({
    searchbar: {
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
    },
    chip: {
        margin: 4
    },
    modalContainer: {
        flex: 1,
        paddingLeft: 25,
        paddingRight: 25,
        paddingTop: 30,
        paddingBottom: 30
    },
    resultHeaderText: {
        padding: 5
    },
    resultHeaderTextError: {
        color: colors.error,
    },
    resultHeader: {
        alignItems: 'center',
    },
    resultHeaderError: {
        backgroundColor: colors.errorContainer,
    },
    resultHeaderOk: {
        backgroundColor: colors.primaryContainer,
    },
    menuItemContainer: {
        justifyContent: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center'
    }
});