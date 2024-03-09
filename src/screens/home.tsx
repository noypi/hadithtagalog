import React from 'react';
import { StyleSheet, FlatList, View, Linking } from 'react-native';
import { Searchbar, ActivityIndicator, Surface, Text, Menu, IconButton, SegmentedButtons, Title, Divider, Button, Switch, RadioButton } from 'react-native-paper';
import { hadithSectionInfoOf, bookNameOf, booksMap } from '@data/';
import { QUERY_STEP } from '@lib/';

import $app, { useAppStore } from '@stores/app';
import $locale, { useLocaleStore } from '@stores/locale';
import $hadiths from '@stores/hadiths';

import { ScreenWrapper } from './screenwrapper';
import { HadithCard, SectionsModal, TagsModal, SectionsSurface, PopupDialog } from './components';


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
                        placeholder={isCategorySearch() ? $tk.SEARCH_CATEGORY_PLACEHOLDER : $tk.SEARCH_PLACEHOLDER}
                        onChangeText={onChangeSearch}
                        onIconPress={onSearch}
                        onSubmitEditing={onSubmitEditing}
                        value={searchQuery}
                        loading={isSearching}
                    />
                    <View style={[styles.menuItemContainer, { flex: 2 }]}>
                        <Switch value={$lang == 'ara'} onValueChange={(b) => onUpdateLocale(b ? 'ara' : 'eng')} />
                        <Text variant="labelLarge">{$tk.LANGSHORT}</Text>
                    </View>
                </Surface>
                <SegmentedButtons
                    value={searchType}
                    onValueChange={v => setSearchType(v == searchType ? '' : v)}
                    buttons={[
                        { value: CATEGORY, label: $tk.SEGBUTTONS_CATEGORY, icon: 'format-list-numbered', onPress: onPressCategories, showSelectedCheck: true },
                        { value: FAVORITES, label: $tk.SEGBUTTONS_FAVORITES, icon: 'star-outline', onPress: onPressFavorites, showSelectedCheck: true },
                        { value: TAGS, label: $tk.SEGBUTTONS_TAGS, icon: 'tag-outline', onPress: onPressTags, showSelectedCheck: true },
                    ]}
                />
                {(resultHeaderError.length > 0) ?
                    (<Surface elevation={4} style={[styles.resultHeader, styles.resultHeaderError]}>
                        <Title style={[styles.resultHeaderText, styles.resultHeaderTextError]}>{resultHeaderError}</Title>
                    </Surface>) : null
                }
                <Surface style={{ flexDirection: 'row', marginRight: 5 }}>
                    <Text style={{ flex: 2, textAlign: 'right', marginRight: 4 }}>({$hadiths.count}/{$hadiths.total})</Text>
                </Surface>
            </Surface>
            {$hadiths.list.length == 0 && !isSearching ?
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
                visible={showSectionModal}
                containerStyle={styles.modalContainer}
                book="bukhari"
                onDismiss={onCategoriesSelected} />
            {/*
            <TagsModal
                title={$tk.TAG_SEARCH_MODAL_TITLE}
                visible={showTagsModal}
                containerStyle={styles.modalContainer}
                tags={knownTags}
                onDeleteTag={onDeleteTag}
                onAddTag={onNewTag}
                onDismiss={onTagsSelected} />
            <TagsModal
                title={$tk.TAG_MODAL_TITLE}
                visible={showHadithTagsModal}
                containerStyle={styles.modalContainer}
                hadithId={hadithIdToTag}
                tags={knownTags}
                hadithTags={tagsOfHadithIdToTag}
                onAddTag={onNewTag}
                onDismiss={onHadithTagsSelected}
                onToggleItem={onToggleHadithTag} />
        */}
        </ScreenWrapper>
    );


    //navigation.setOptions({header: () => null});
    const { $theme, $colors } = useAppStore();
    const { $tk, $lang } = useLocaleStore();
    const styles = makeStyles($colors);

    const [searchType, setSearchType] = React.useState('');
    const [favoritesLocal, setFavoritesLocal] = React.useState({});
    const [showSectionModal, setShowSectionModal] = React.useState(false);
    const [showTagsModal, setShowTagsModal] = React.useState(false);
    const [showHadithTagsModal, setShowHadithTagsModal] = React.useState(false);
    const [showRemindersDialog, setShowRemindersDialog] = React.useState(true);
    const [showMenu, setShowMenu] = React.useState(false);
    const [hadithIdToTag, setHadithIdToTag] = React.useState('');
    const [tagsOfHadithIdToTag, setTagsOfHadithIdToTag] = React.useState([]);
    const [knownTags, setKnownTags] = React.useState([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCategories, setSelectedCategories] = React.useState({});
    const [highlightWords, setHighlightWords] = React.useState([]);
    const [isResultGenDone, setIsResultGenDone] = React.useState(true);
    const [resultGen, setResultGen] = React.useState({ next: () => ({ value: [], done: true }) });
    const [resultHeader, setResultHeader] = React.useState('');
    const [resultHeaderError, setResultHeaderError] = React.useState('');
    const [isLightMode, setIsLightMode] = React.useState(!$locale.is_dark);

    const isCategorySearch = () => searchType == CATEGORY;
    const isFavoritesSearch = () => searchType == FAVORITES;
    const isTagsSearch = () => searchType == TAGS;
    const searchWords = () => searchQuery.split(' ').filter(word => word.length > 0);

    const onBeforePressSearchType = () => {
        setResultHeaderError('');
    };

    const onChangeSearch = query => {
        //console.debug('+- onChangeSearch() =>', {query});
        setSearchQuery(query)
    }

    const onSearch = async () => {
        console.debug('+-onSearch()');
        const words = searchWords();
        setHighlightWords(words);
        setResultHeader('');
        setResultHeaderError('');
        if (searchType == FAVORITES ||
            searchType == TAGS) {
            setSearchType(''); // fixes #16
        }

        let has_search_result = false;
        try {
            setIsSearching(true);

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
            const totals = await $hadiths.search({ match_ids, match_content, match_books, selected: isCategorySearch() ? selectedCategories : null });
            has_search_result = !!totals.search_total;
        }
        finally {
            setIsSearching(false);
        }

        if ($hadiths.count > 0) {
            let msg = '';
            if (isCategorySearch()) {
                msg = (has_search_result) ? $tk.SEARCH_CATEGORIES_RESULT_MESSAGE : $tk.SEARCH_IDS_RESULT_MESSAGE;
            } else {
                msg = (has_search_result) ? $tk.SEARCH_RESULT_MESSAGE : $tk.SEARCH_IDS_RESULT_MESSAGE;
            }
            setResultHeader(msg);
        } else {
            let msg = '';
            if (isCategorySearch()) {
                msg = $tk.SEARCH_WITH_CATEGORIES_ZERO_RESULT_MESSAGE;
            } else {
                msg = $tk.SEARCH_ZERO_RESULT_MESSAGE;
            }
            setResultHeaderError(msg);
        }
    }

    const onScrollToEnd = async () => {
        console.debug('+onScrollToEnd')
        setIsSearching(true);
        try {
            console.debug('onScrollToEnd..');
            await $hadiths.load_more();
        }
        finally {
            setIsSearching(false);
        }
    }

    const onSubmitEditing = async ({ nativeEvent: { text } }) => {
        setHighlightWords(searchWords());
        onSearch();
    };

    const onCategoriesSelected = async (selected) => {
        console.debug('+-onCategoriesSelected() =>', selected);
        setResultHeader('');
        setResultHeaderError('');
        setShowSectionModal(false);
        setSelectedCategories(selected);

        if (Object.keys(selected).length == 0) {
            setResultHeaderError($tk.SEARCH_CATEGORIES_ZERO_RESULT_MESSAGE);
            return
        };

        try {
            setIsSearching(true);
            await $hadiths.update(selected);
        }
        finally {
            setIsSearching(false);
        }

        if ($hadiths.count > 0) {
            setResultHeader($tk.SEARCH_CATEGORIES_RESULT_MESSAGE);
        } else {
            setSearchType('');
            setResultHeaderError($tk.SEARCH_CATEGORIES_ZERO_RESULT_MESSAGE);
        }
    }

    const renderHadithCardStart = () => {
        //console.log('renderHadithCardStart', {isResultGenDone});
        if (resultHeader.length > 0) {
            return (<Surface elevation={4} style={[styles.resultHeader]}><Title style={styles.resultHeaderText}>{resultHeader}</Title></Surface>);
        }
        return null;
    }

    const renderHadithCardEnd = () => {
        //console.log('renderHadithCardEnd', {isResultGenDone});
        if (!isResultGenDone && $hadiths.list.length >= QUERY_STEP) {
            return (<ActivityIndicator animating={true} size="large" style={{ marginBottom: 40 }} />)
        }
        return null;
    }

    const onPressCategories = () => {
        console.debug('onPressCategories', { searchType });
        onBeforePressSearchType();
        if (!isCategorySearch()) {
            setShowSectionModal(true);
        } else {
            $hadiths.reset();
            setSearchType('');
            setSelectedCategories({});
        }
    }

    const updateKnownTags = async (sortfn: (a: string, b: string) => void = () => { }) => {
        let tags = await $$db.getTags();
        console.debug('updateKnownTags', { tags });
        tags = tags.sort();
        setKnownTags(tags.sort(sortfn));
    }

    const onPressTags = async () => {
        onBeforePressSearchType();
        if (!isTagsSearch()) {
            await updateKnownTags();
            setShowTagsModal(true);
        } else {
            $hadiths.reset();
            setSearchType('');
        }
    }

    const onToggleHadithTag = async (hadithId, tag, isSelected) => {
        if (tag.length == 0) { return }

        isSelected ?
            await $$db.addHadithTag(hadithId, tag) :
            await $$db.removeHadithTag(hadithId, tag);
    }

    const onHadithTagsSelected = async (selected) => {
        setShowHadithTagsModal(false);
    }

    const onTagsSelected = async (selected) => {
        console.debug('onTagsSelected', { selected });
        setShowTagsModal(false);

        if (selected.length == 0) {
            setResultHeaderError($tk.SEARCH_TAGS_ZERO_RESULT_MESSAGE);
            setSearchType('');
            return
        }

        setIsSearching(true);
        setHadithsTotal(0);
        let rg = await $$db.getTagged(selected);
        setResultGen(rg);
        let y = await rg.next();
        //console.debug('onTagsSelected', {y});
        setIsSearching(false);

        let results = y?.value;
        setIsResultGenDone(y.done);
        setHadithsSafe(results?.translations);
        setHadithsTotal(results?.total ?? 0);

        if (results?.translations?.length > 0 ?? false) {
            setResultHeader($tk.SEARCH_TAGS_RESULT_MESSAGE);
        } else {
            setResultHeaderError($tk.SEARCH_TAGS_ZERO_RESULT_MESSAGE);
        }
    }

    const onDeleteTag = async (tag) => {
        console.debug('onDeleteTag', { tag });
        await $$db.delTagAndUnTagHadiths(tag);
        await updateKnownTags();
    }

    const onNewTag = async (tag) => {
        console.debug('onNewTag', { tag });
        if (await $$db.newTag(tag)) {
            await updateKnownTags();
        } else {
            console.warn('tag not added');
        }
    }

    const onShowTagHadithModal = async (id) => {
        let tags: Array<string> = await $$db.getHadithTags(id);
        console.debug('onShowTagHadithModal', { tags });
        // pass sortfn to place selected first in order
        await updateKnownTags((a: string, b: string) => tags.indexOf(a) < 0 ? 1 : tags.indexOf(b) < 0 ? -1 : a.localeCompare(b));
        setTagsOfHadithIdToTag(tags);
        setHadithIdToTag(id);
        setShowHadithTagsModal(true);
    }

    const onPressFavorites = async () => {
        onBeforePressSearchType();
        if (!isFavoritesSearch()) {
            setIsSearching(true);
            setHadithsTotal(0);
            let rg = await $$db.getFavorites();
            setResultGen(rg);
            let y = await rg.next();
            setIsResultGenDone(y.done);
            //console.debug({favorites: y.value});
            let results = y?.value ?? [];
            setHadithsSafe(results?.translations);
            setHadithsTotal(results?.total);
            setFavoritesLocal({});
            setIsSearching(false);
            if (results?.translations?.length > 0 ?? false) {
                setResultHeader($tk.SEARCH_FAVORITES_RESULT_MESSAGE)
            } else {
                setResultHeaderError($tk.SEARCH_FAVORITES_ZERO_RESULT_MESSAGE);
                setSearchType('');
            }
        } else {
            setHadiths([]);
            setSearchType('');
        }
    }

    const onAddFavorite = async (id) => {
        await $$db.addFavorite(id);
        setFavoritesLocal(Object.assign({}, favoritesLocal, { [id]: true }));
    }

    const onRemoveFavorite = async (id) => {
        await $$db.removeFavorite(id);
        setFavoritesLocal(Object.assign({}, favoritesLocal, { [id]: false }));
    }

    const onUpdateLocale = (l) => {
        setLocale(l);
    }

    function render_hadith_card(item) {
        item = item.item;

        if (item === 'start') { return renderHadithCardStart() }
        else if (item === 'end') { return renderHadithCardEnd() }

        if (!item || !item.content) {
            return null;
        }
        //console.log('renderHadithCard => ', { item });
        const [book, id] = splitHadithId(item.id);
        const text = item.content;
        const atColon = text.indexOf(':');
        const cardTitle = (atColon > 0) ? text.slice(0, atColon) : '';
        const content = text.slice(text.indexOf(':') + 1); // if atColon is -1 => then .slice(0) => original text
        const highlights = highlightWords.filter(v => (/^[a-z0-9]+$/i).test(v));
        const sectionInfo = book == 'bukhari' ? hadithSectionInfoOf(item.id) : { title: '', id: 0 };
        const isFavorite = item.id in favoritesLocal ? favoritesLocal[item.id] : !!item.favorite_id;
        const props = {
            onAddFavorite,
            onRemoveFavorite,
            onTagHadith: onShowTagHadithModal,
            isFavorite: isFavorite,
            id: item.id,
            highlights,
            cardTitle,
            title: `${sectionInfo.id}. ${sectionInfo.title}`,
            content,
            subtitle: `${bookNameOf(book)} (${id})`,
            extraData: !!favoritesLocal[item.id]
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