import React, { useMemo } from 'react';
import { StyleSheet, FlatList, View, Linking } from 'react-native';
import _ from 'lodash';
import { Searchbar, ActivityIndicator, Surface, Text, Menu, IconButton, SegmentedButtons, Title, Divider, Button, Switch, RadioButton } from 'react-native-paper';
import { hadithSectionInfoOf, bookNameOf, booksMap } from '@data/';
import { QUERY_STEP, ref, split_hadith_id, watch } from '@lib/';

import $app, { useAppStore } from '@stores/app';
import $locale, { useLocaleStore } from '@stores/locale';
import $hadiths from '@stores/hadiths';
import $db from '@stores/hadiths_db';

import { ScreenWrapper } from './screenwrapper';
import { HadithCard, SectionsModal, TagsModal, SectionsSurface, PopupDialog } from './components';
import { useFlag } from 'src/composables/flag';


const CATEGORY = 'category';
const FAVORITES = 'favorites';
const TAGS = 'tags';

const FBGGROUP = 'https://web.facebook.com/groups/833486274413858';

export const HomeScreen = (options) => {

    const $screen = () => (
        <ScreenWrapper>
            <Surface elevation={2}>
                <Surface style={{ flexDirection: 'row' }}>
                    <Searchbar
                        style={[styles.searchbar, { flex: 8 }]}
                        placeholder={is_category_search ? $tk.SEARCH_CATEGORY_PLACEHOLDER : $tk.SEARCH_PLACEHOLDER}
                        onChangeText={query => search_query.value = query}
                        onIconPress={on_search}
                        onSubmitEditing={on_search}
                        value={search_query.value}
                        loading={searchingf.value}
                    />
                    <View style={[styles.menuItemContainer, { flex: 2 }]}>
                        <Switch value={$lang == 'ara'} onValueChange={(b) => onUpdateLocale(b ? 'ara' : 'eng')} />
                        <Text variant="labelLarge">{$tk.LANGSHORT}</Text>
                    </View>
                </Surface>
                <SegmentedButtons
                    value={search_type.value}
                    onValueChange={v => search_type.value = (v === search_type.value ? '' : v)}
                    buttons={[
                        { value: CATEGORY, label: $tk.SEGBUTTONS_CATEGORY, icon: 'format-list-numbered', onPress: onPressCategories, showSelectedCheck: true },
                        { value: FAVORITES, label: $tk.SEGBUTTONS_FAVORITES, icon: 'star-outline', onPress: onPressFavorites, showSelectedCheck: true },
                        { value: TAGS, label: $tk.SEGBUTTONS_TAGS, icon: 'tag-outline', onPress: onPressTags, showSelectedCheck: true },
                    ]}
                />
                {(result_header_error.value.length > 0) ?
                    (<Surface elevation={4} style={[styles.resultHeader, styles.resultHeaderError]}>
                        <Title style={[styles.resultHeaderText, styles.resultHeaderTextError]}>{result_header_error.value}</Title>
                    </Surface>) : null
                }
                <Surface style={{ flexDirection: 'row', marginRight: 5 }}>
                    <Text style={{ flex: 2, textAlign: 'right', marginRight: 4 }}>({$hadiths.count}/{$hadiths.total})</Text>
                </Surface>
            </Surface>
            {$hadiths.list.length == 0 && !searchingf.value ?
                <SectionsSurface
                    containerStyle={styles.modalContainer}
                    book="bukhari"
                    onPressItem={onCategoriesSelected} /> : null
            }

            <FlatList
                data={['start', ...$hadiths.list, 'end']}
                keyExtractor={(item, i) => i}
                renderItem={render_hadith_card}
                onEndReached={onScrollToEnd}
                onEndReachedThreshold={1}
            />

            <SectionsModal
                visible={section_modal_visible.value}
                containerStyle={styles.modalContainer}
                book="bukhari"
                onDismiss={onCategoriesSelected} />

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

        </ScreenWrapper>
    );


    //navigation.setOptions({header: () => null});
    const { $theme, $colors } = useAppStore();
    const { $tk, $lang } = useLocaleStore();
    const styles = watch($colors, v => makeStyles(v));

    const search_type = ref('');
    const search_query = ref('');
    const result_header = ref('');
    const result_header_error = ref('');

    const selected_categories = ref<any>([]);
    const searchingf = useFlag(false);
    const known_tags = ref<string[]>([]);
    const favorites_local = ref<any>({});

    const section_modal_visible = ref(false);
    const tags_modal_visible = ref(false);
    const hadith_tag_modal_visible = ref(false);

    const is_light_mode = watch($app.is_dark, v => !v);
    const is_category_search = watch(search_type, v => v === CATEGORY);
    const is_favorite_search = watch(search_type, v => v === FAVORITES);
    const is_tag_search = watch(search_type, v => v === TAGS);
    const search_words = watch(search_query.value, v => v.split(' ').filter(word => word.length > 0));
    const highlighted_words = watch(search_words.value, v => v);

    const tags_of_hadith_id_to_tag = ref([]);
    const hadith_id_to_tag = ref('');

    const onBeforePressSearchType = () => {
        result_header_error.value = '';
    };

    async function on_search() {
        console.debug('+-on_search()');
        const words = search_words.value;
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
            const totals = await $hadiths.search({ match_ids, match_content, match_books, selected: is_category_search ? selectedCategories : null });
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

    const onScrollToEnd = async () => {
        console.debug('+onScrollToEnd')

        await searchingf.execute(async () => {
            console.debug('onScrollToEnd..');
            await $hadiths.load_more();
        });
    }

    const onCategoriesSelected = async (selected) => {
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

    const renderHadithCardStart = () => {
        //console.log('renderHadithCardStart', {isResultGenDone});
        if (result_header.value.length > 0) {
            return (<Surface elevation={4} style={[styles.resultHeader]}><Title style={styles.resultHeaderText}>{result_header.value}</Title></Surface>);
        }
        return null;
    }

    const renderHadithCardEnd = () => {
        //console.log('renderHadithCardEnd', {isResultGenDone});
        if (!$hadiths.done && $hadiths.count >= QUERY_STEP) {
            return (<ActivityIndicator animating={true} size="large" style={{ marginBottom: 40 }} />)
        }
        return null;
    }

    const onPressCategories = () => {
        console.debug('onPressCategories', { search_type: search_type.value });
        onBeforePressSearchType();
        if (!is_category_search) {
            section_modal_visible.value = true;
        } else {
            $hadiths.reset();
            search_type.value = '';
            selected_categories.value = {};
        }
    }

    const updateKnownTags = async (sortfn: (a: string, b: string) => void = () => { }) => {
        let tags = await $db.get_tags();
        console.debug('updateKnownTags', { tags });
        tags = tags.sort();
        known_tags.value = tags.sort(sortfn);
    }

    async function onPressTags() {
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

    async function onShowTagHadithModal(id) {
        let tags: Array<string> = await $db.get_hadith_tags(id);
        console.debug('onShowTagHadithModal', { tags });
        // pass sortfn to place selected first in order
        await updateKnownTags((a: string, b: string) => tags.indexOf(a) < 0 ? 1 : tags.indexOf(b) < 0 ? -1 : a.localeCompare(b));
        tags_of_hadith_id_to_tag.value = tags;
        hadith_id_to_tag.value = id;
        hadith_tag_modal_visible.value = true;
    }

    async function onPressFavorites() {
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

    async function onAddFavorite(id) {
        await $db.add_favorite(id);
        favorites_local.value = Object.assign({}, favorites_local.value, { [id]: true });
    }

    async function onRemoveFavorite(id) {
        await $db.remove_favorite(id);
        favorites_local.value = Object.assign({}, favorites_local.value, { [id]: false });
    }

    function onUpdateLocale(locale) {
        $locale.set_locale(locale);
    }

    function render_hadith_card(item) {
        item = item.item;

        if (item === 'start') { return renderHadithCardStart() }
        else if (item === 'end') { return renderHadithCardEnd() }

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
            onAddFavorite,
            onRemoveFavorite,
            onTagHadith: onShowTagHadithModal,
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