import React from 'react';
import {StyleSheet, FlatList, View} from 'react-native';
import { Searchbar, ActivityIndicator, Surface, Text, Checkbox, SegmentedButtons, Title } from 'react-native-paper';
import {hadithBooks, hadithSectionOf} from '@data';
import {openHadithsDb, QUERY_STEP} from '@lib';

import {ScreenWrapper} from './screenwrapper';
import {HadithCard, SectionsModal, TagsModal, SectionsSurface} from './components';

const CATEGORY = "category";
const FAVORITES = "favorites";
const TAGS = "tags"

let dbfil;
openHadithsDb('hadiths.db').then(db => dbfil = db);

export const HomeScreen = () => {
    const theme = useAppTheme();
    const {colors} = theme;
    const styles = makeStyles(colors);
    const [hadiths, setHadiths] = React.useState([]);
    const [searchType, setSearchType] = React.useState("");
    const [favoritesLocal, setFavoritesLocal] = React.useState({});
    const [showSectionModal, setShowSectionModal] = React.useState(false);
    const [showTagsModal, setShowTagsModal] = React.useState(false);
    const [showHadithTagsModal, setShowHadithTagsModal] = React.useState(false);
    const [hadithIdToTag, setHadithIdToTag] = React.useState("");
    const [tagsOfHadithIdToTag, setTagsOfHadithIdToTag] = React.useState([]);
    const [knownTags, setKnownTags] = React.useState([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCategories, setSelectedCategories] = React.useState({});
    const [searchWords, setSearchWords] = React.useState([]);
    const [isResultGenDone, setIsResultGenDone] = React.useState(true);
    const [resultGen, setResultGen] = React.useState({next: () => ({value:[], done: true})});
    const [resultHeader, setResultHeader] = React.useState("");
    const [resultHeaderError, setResultHeaderError] = React.useState("");

    const isCategorySearch = () => searchType == CATEGORY;
    const isFavoritesSearch = () => searchType == FAVORITES;
    const isTagsSearch = () => searchType == TAGS;

    const onBeforePressSearchType = () => {
        setResultHeaderError("");
    };
    
    const onChangeSearch = query => {
        //console.debug("+- onChangeSearch() =>", {query});
        setSearchQuery(query)
        setSearchWords(query.split(" ").filter(word => word.length > 0));
    }

    const setHadithsSafe = (hs) => {
        setHadiths(!hs ? [] : hs);
    }

    const onSearch = async () => {
        setResultHeader("");
        setResultHeaderError("");

        setIsSearching(true);
        let matchIds = searchWords.filter(w => Number.isInteger(parseInt(w)));
        let matchContent = searchQuery;

        // match 
        //  - integer ids on search bar
        //  - hadith content
        //  - selected categories on search
        let rg = await dbfil?.search({matchContent, matchIds, selected: isCategorySearch() ? selectedCategories : null});
        setResultGen(rg);
        let y = await rg.next();
        setIsResultGenDone(y.done);
        let results = y.value;
        setHadithsSafe(results);
        setIsSearching(false);
        if (results.length > 0) {
            let msg = "";
            if (isCategorySearch()) { 
                msg = $SEARCH_CATEGORIES_RESULT_MESSAGE;
            } else {
                msg = $SEARCH_RESULT_MESSAGE;
            }
            setResultHeader(msg);
        } else {
            let msg = "";
            if (isCategorySearch()) {
                msg = $SEARCH_WITH_CATEGORIES_ZERO_RESULT_MESSAGE;
            }
            setResultHeaderError(msg);
        }
    }

    const onScrollToEnd = async () => {
        setIsSearching(true);
        let y = await resultGen.next();
        console.debug("onScrollToEnd ", {done: y.done});
        setIsResultGenDone(y.done);
        if (!y.done) {
            let results = y.value;
            setHadithsSafe([...hadiths, ...results]);
        }        
        setIsSearching(false);
    }

    const onSubmitEditing = async ({nativeEvent: {text}}) => {
        onSearch();
    };

    const onCategoriesSelected = async (selected) => {
        console.debug("+-onCategoriesSelected() =>", selected);
        setResultHeader("");
        setResultHeaderError("");
        setShowSectionModal(false);
        setSelectedCategories(selected);

        if (Object.keys(selected).length == 0) { 
            setResultHeaderError($SEARCH_CATEGORIES_ZERO_RESULT_MESSAGE);
            return 
        };

        setIsSearching(true);

        let rg = await dbfil?.getSelectedRanges(selected)
        setResultGen(rg);
        let y = await rg.next();
        setIsResultGenDone(y.done);
        let results: Array<any> = y.value;
        setHadithsSafe(results);
        setIsSearching(false);
        if (results.length > 0) {
            setResultHeader($SEARCH_CATEGORIES_RESULT_MESSAGE);
        } else {
            setSearchType("");
            setResultHeaderError($SEARCH_CATEGORIES_ZERO_RESULT_MESSAGE);
        }        
    }

    const renderHadithCardStart = () => {
        if (resultHeader.length > 0) { 
            return (<Surface elevation="4" style={[styles.resultHeader]}><Title style={styles.resultHeaderText}>{resultHeader}</Title></Surface>);
        }
        return null;
    }

    const renderHadithCardEnd = () => {
        console.log("renderHadithCardEnd", {isResultGenDone});
        if (!isResultGenDone && hadiths.length >= QUERY_STEP) {
            return (<ActivityIndicator animating={true} size="large" style={{marginBottom: 40}}/>)
        }
        return null;
    }

    const onPressCategories = () => {
        console.debug("onPressCategories", {searchType});
        onBeforePressSearchType();
        if (!isCategorySearch()) {
            setShowSectionModal(true);
        } else {
            setHadiths([]);
            setSearchType("");
            setSelectedCategories({});
        }
    }

    const updateKnownTags = async (sortfn:(a:string, b:string) => void = () => {}) => {
        let tags = await dbfil.getTags();
        console.debug("updateKnownTags", {tags});
        tags = tags.sort();
        setKnownTags(tags.sort(sortfn));
    }

    const onPressTags = async() => {
        onBeforePressSearchType();
        if (!isTagsSearch()) {
            await updateKnownTags();
            setShowTagsModal(true);
        } else {
            setHadiths([]);
            setSearchType("");
        }
    }

    const onToggleHadithTag = async (hadithId, tag, isSelected) => {
        if (tag.length == 0) {return}

        isSelected ? 
            await dbfil.addHadithTag(hadithId, tag) :
            await dbfil.removeHadithTag(hadithId, tag);
    }

    const onHadithTagsSelected = async (selected) => {
        setShowHadithTagsModal(false);
    }

    const onTagsSelected = async(selected) => {
        console.debug("onTagsSelected", {selected});
        setShowTagsModal(false);

        if (selected.length == 0) {
            setResultHeaderError($SEARCH_TAGS_ZERO_RESULT_MESSAGE);
            setSearchType("");
            return
        }

        setIsSearching(true);
        let rg = await dbfil.getTagged(selected);
        setResultGen(rg);
        let y = await rg.next();
        console.debug("onTagsSelected", {y});
        setIsSearching(false);
        
        setIsResultGenDone(y.done);
        setHadithsSafe(y.value);

        if (y.value.length > 0) {
            setResultHeader($SEARCH_TAGS_RESULT_MESSAGE);
        } else {
            setResultHeaderError($SEARCH_TAGS_ZERO_RESULT_MESSAGE);
        }
    }

    const onDeleteTag = async (tag) => {
        console.debug("onDeleteTag", {tag});
        await dbfil.delTagAndUnTagHadiths(tag);
        await updateKnownTags();
    }

    const onNewTag = async (tag) => {
        console.debug("onNewTag", {tag});
        if (await dbfil.newTag(tag)) {
            await updateKnownTags();
        } else {
            console.warn("tag not added");
        }
    }

    const onShowTagHadithModal = async (id) => {
        let tags: Array<string> = await dbfil.getHadithTags(id);
        console.debug("onShowTagHadithModal", {tags});
        // pass sortfn to place selected first in order
        await updateKnownTags((a:string, b:string) => tags.indexOf(a)<0 ? 1 : tags.indexOf(b)<0? -1 : a.localeCompare(b));
        setTagsOfHadithIdToTag(tags);
        setHadithIdToTag(id);
        setShowHadithTagsModal(true);
    }

    const onPressFavorites = async () => {
        onBeforePressSearchType();
        if (!isFavoritesSearch()) {
            setIsSearching(true);
            let rg = await dbfil.getFavorites();
            setResultGen(rg);
            let y = await rg.next();
            setIsResultGenDone(y.done);
            //console.debug({favorites: y.value});
            setHadithsSafe(y.value);
            setFavoritesLocal({});
            setIsSearching(false);
            if (y.value.length > 0) {
                setResultHeader($SEARCH_FAVORITES_RESULT_MESSAGE)
            } else {
                setResultHeaderError($SEARCH_FAVORITES_ZERO_RESULT_MESSAGE);
                setSearchType("");
            }
        } else {
            setHadiths([]);
            setSearchType("");
        }
    }

    const onAddFavorite = async (id) => {
        await dbfil.addFavorite(id);
        setFavoritesLocal(Object.assign({}, favoritesLocal, {[id]: true}));
    }

    const onRemoveFavorite = async (id) => {
        await dbfil.removeFavorite(id);
        setFavoritesLocal(Object.assign({}, favoritesLocal, {[id]: false}));
    }

    const renderHadithCard = (item) => {        
        item = item.item;

        if (item === "start") {return renderHadithCardStart()}
        else if (item === "end") {return renderHadithCardEnd()}

        if (!item || !item.content) {
            return null;
        }
        //console.log("renderHadithCard => ", {item});
        const text = item.content;
        const atColon = text.indexOf(":");
        const cardTitle = (atColon>0) ? text.slice(0, atColon) : "";
        const content = text.slice(text.indexOf(":")+1); // if atColon is -1 => then .slice(0) => original text
        const highlights = searchWords;
        const sectionInfo = hadithSectionOf(item.id);
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
            subtitle: item.id,
            extraData: !!favoritesLocal[item.id]
        }
        return (<HadithCard {...props}/>);
    }

    return (
        <ScreenWrapper>
            <Surface elevation="2">
                <Surface>
                    <Searchbar
                        style={styles.searchbar}
                        placeholder={isCategorySearch() ? $SEARCH_CATEGORY_PLACEHOLDER : $SEARCH_PLACEHOLDER}
                        onChangeText={onChangeSearch}
                        onIconPress={onSearch}
                        onSubmitEditing={onSubmitEditing}
                        value={searchQuery}
                        loading={isSearching}
                        placeholderTextColor="rgba(84, 99, 77, 0.55)"
                    />
                </Surface>
                <SegmentedButtons
                        value={searchType}
                        onValueChange={v => setSearchType(v==searchType ? "" : v)}
                        buttons={[
                        { value: CATEGORY, label: 'Kategorya', icon: 'format-list-numbered', onPress: onPressCategories, showSelectedCheck: true},
                        { value: FAVORITES, label: 'Paborito', icon: 'star-outline', onPress: onPressFavorites, showSelectedCheck: true},
                        { value: TAGS, label: 'Tags', icon: 'tag-outline', onPress: onPressTags, showSelectedCheck: true },
                        ]}
                    />
                {(resultHeaderError.length > 0) ? 
                    (<Surface elevation="4" style={[styles.resultHeader, styles.resultHeaderError]}>
                        <Title style={[styles.resultHeaderText, styles.resultHeaderTextError]}>{resultHeaderError}</Title>
                    </Surface>) : null
                }
                <Surface style={{flexDirection: 'row', marginRight:5}}>
                    <Text style={{flex: 2, textAlign:'right', marginRight:4}}>(xxx{hadiths.length}/xxxx)</Text>
                </Surface>
            </Surface>
                {hadiths.length == 0 && !isSearching ?
                    <SectionsSurface 
                        containerStyle={styles.modalContainer} 
                        book="bukhari"
                        onPressItem={onCategoriesSelected} /> : null
                }
            <FlatList
                data={["start", ...hadiths, "end"]}
                keyExtractor={(item, i) => i}
                renderItem={renderHadithCard}
                onEndReached={onScrollToEnd}
                onEndReachedThreshold={1}
            />

            <SectionsModal 
                visible={showSectionModal} 
                containerStyle={styles.modalContainer} 
                book="bukhari"
                onDismiss={onCategoriesSelected} />
            <TagsModal 
                title={$TAG_SEARCH_MODAL_TITLE}
                visible={showTagsModal} 
                containerStyle={styles.modalContainer} 
                tags={knownTags}
                onDeleteTag={onDeleteTag}
                onAddTag={onNewTag}
                onDismiss={onTagsSelected} />
            <TagsModal 
                title={$TAG_MODAL_TITLE}
                visible={showHadithTagsModal} 
                containerStyle={styles.modalContainer} 
                hadithId={hadithIdToTag}
                tags={knownTags}
                hadithTags={tagsOfHadithIdToTag}
                onAddTag={onNewTag}
                onDismiss={onHadithTagsSelected} 
                onToggleItem={onToggleHadithTag}/>
        </ScreenWrapper>
    );
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
        padding:5
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
    }
});