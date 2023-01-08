import React from 'react';
import {StyleSheet, FlatList, View} from 'react-native';
import { Searchbar, ActivityIndicator, Surface, Text, Checkbox, IconButton, Title } from 'react-native-paper';
import {hadithBooks, hadithSectionOf} from '@data';
import {openHadithsDb, QUERY_STEP} from '@lib';

import {ScreenWrapper} from './screenwrapper';
import {HadithCard, SectionsModal, TagsModal} from './components';

let dbfil;
openHadithsDb('hadiths.db').then(db => dbfil = db);

export const HomeScreen = () => {
    const {colors} = useAppTheme();
    const styles = makeStyles(colors);
    const [hadiths, setHadiths] = React.useState([]);
    const [favoritesLocal, setFavoritesLocal] = React.useState({});
    const [showSectionModal, setShowSectionModal] = React.useState(false);
    const [showTagsModal, setShowTagsModal] = React.useState(false);
    const [showHadithTagsModal, setShowHadithTagsModal] = React.useState(false);
    const [hadithIdToTag, setHadithIdToTag] = React.useState("");
    const [tagsOfHadithIdToTag, setTagsOfHadithIdToTag] = React.useState([]);
    const [knownTags, setKnownTags] = React.useState([]);
    const [useSelectedOnSearch, setUseSelectedOnSearch] = React.useState(false);
    const [useFavoritesOnSearch, setUseFavoritesOnSearch] = React.useState(false);
    const [useTagsOnSearch, setUseTagsOnSearch] = React.useState(false);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCategories, setSelectedCategories] = React.useState({});
    const [searchWords, setSearchWords] = React.useState([]);
    const [isResultGenDone, setIsResultGenDone] = React.useState(true);
    const [resultGen, setResultGen] = React.useState({next: () => ({value:[], done: true})});
    const [resultHeader, setResultHeader] = React.useState("");
    const [resultHeaderError, setResultHeaderError] = React.useState("");
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

        setUseFavoritesOnSearch(false);
        setUseTagsOnSearch(false);
        setIsSearching(true);
        let matchIds = searchWords.filter(w => Number.isInteger(parseInt(w)));
        let matchContent = searchQuery;

        // match 
        //  - integer ids on search bar
        //  - hadith content
        //  - selected categories on search
        let rg = await dbfil?.search({matchContent, matchIds, selected: useSelectedOnSearch ? selectedCategories : null});
        setResultGen(rg);
        let y = await rg.next();
        setIsResultGenDone(y.done);
        let results = y.value;
        setHadithsSafe(results);
        setIsSearching(false);
        if (results.length > 0) {
            let msg = "";
            if (useSelectedOnSearch) { 
                msg = "Mga Hadith sa Kategorya";
            } else {
                msg = "Mga Nahanap na Hadith"
            }
            setResultHeader(msg);
        } else {
            let msg = "";
            if (useSelectedOnSearch) {
                msg = "Walang nakita. Subukang tanggalin ang kategorya."
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

    const onSectionsSelected = async (selected) => {
        console.debug("+-onSectionsSelected() =>", selected);
        setResultHeader("");
        setResultHeaderError("");
        setShowSectionModal(false);
        setSelectedCategories(selected);

        if (Object.keys(selected).length == 0) { return };

        setIsSearching(true);

        let rg = await dbfil?.getSelectedRanges(selected)
        setResultGen(rg);
        let y = await rg.next();
        setIsResultGenDone(y.done);
        let results: Array<any> = y.value;
        setHadithsSafe(results);
        setIsSearching(false);
        if (results.length > 0) {
            let msg = "Mga Hadith sa Kategorya";
            setResultHeader(msg);

            setUseTagsOnSearch(false);
            setUseFavoritesOnSearch(false);
        }
        setUseSelectedOnSearch(results.length > 0);        
    }

    const renderHadithCardStart = () => {
        if (resultHeader.length > 0) { 
            return (<Surface elevation="4" style={[styles.resultHeader, styles.resultHeaderOk]}><Title style={styles.resultHeaderText}>{resultHeader}</Title></Surface>);
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
        if (useSelectedOnSearch) {
            setUseSelectedOnSearch(false);
        } else {
            setShowSectionModal(true);
        }
    }

    const updateKnownTags = async (sortfn:(a:string, b:string) => void = () => {}) => {
        let tags = await dbfil.getTags();
        console.debug("updateKnownTags", {tags});
        tags = tags.sort();
        setKnownTags(tags.sort(sortfn));
    }

    const onPressTags = async() => {
        if (!useTagsOnSearch) {
            await updateKnownTags();
            setShowTagsModal(true);
        } else {
            setUseTagsOnSearch(false);
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

        if (selected.length == 0) {return}

        setIsSearching(true);
        let rg = await dbfil.getTagged(selected);
        setResultGen(rg);
        let y = await rg.next();
        console.debug("onTagsSelected", {y});
        setIsSearching(false);
        
        setUseSelectedOnSearch(false);
        setUseFavoritesOnSearch(false);
        setUseTagsOnSearch(true);

        setIsResultGenDone(y.done);
        setHadithsSafe(y.value);

        if (y.value.length > 0) {
            setResultHeader("Mga Hadiths na may Tag");
        } else {
            setResultHeaderError("Walang nakitang Hadith na may Tag");
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
        if (!useFavoritesOnSearch) {
            setIsSearching(true);
            let rg = await dbfil.getFavorites();
            setResultGen(rg);
            let y = await rg.next();
            setIsResultGenDone(y.done);
            //console.debug({favorites: y.value});
            setHadithsSafe(y.value);
            setFavoritesLocal({});
            setUseTagsOnSearch(false);
            setUseSelectedOnSearch(false);
            setIsSearching(false);
            setResultHeader("Mga Paboritong Hadith");
        } else {
            setHadiths([]);
        }
        setUseFavoritesOnSearch(!useFavoritesOnSearch);
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
            <Surface elevation="2" style={{hidden: true}}>
                <Searchbar
                    placeholder={useSelectedOnSearch ? "...Maghanap sa Kategorya" : "...Maghanap ng Hadith"}
                    onChangeText={onChangeSearch}
                    onIconPress={onSearch}
                    onSubmitEditing={onSubmitEditing}
                    value={searchQuery}
                    loading={isSearching}
                    placeholderTextColor="rgba(84, 99, 77, 0.55)"
                />
                <Surface style={{flexDirection: 'row', alignItems: 'center', marginRight:5}}>
                        <View style={{flexDirection: 'row', flex: 4, alignItems: 'center'}}>
                            <Checkbox
                                status={useSelectedOnSearch ? 'checked' : 'unchecked'}
                                onPress={onPressCategories}
                            />
                            <Text>Kategorya</Text>
                        </View>
                        <View style={{flexDirection: 'row', flex: 4, alignItems: 'center'}}>
                            <Checkbox
                                status={useFavoritesOnSearch ? 'checked' : 'unchecked'}
                                onPress={onPressFavorites}
                            />
                            <Text>Paborito</Text>
                        </View>
                        <View style={{flexDirection: 'row', flex: 4, alignItems: 'center'}}>
                            <Checkbox
                                status={useTagsOnSearch ? 'checked' : 'unchecked'}
                                onPress={onPressTags}
                            />
                            <Text>Tags</Text>
                        </View>
                        <Text style={{flex: 1}}>({hadiths.length})</Text>
                </Surface>
            </Surface>
            {(resultHeaderError.length > 0) ? 
                (<Surface elevation="4" style={[styles.resultHeader, styles.resultHeaderError]}><Title style={[styles.resultHeaderText, styles.resultHeaderTextError]}>{resultHeaderError}</Title></Surface>) : null
            }
            <FlatList
                data={["start", ...hadiths, "end"]}
                keyExtractor={(item, i) => i}
                renderItem={renderHadithCard}
                onEndReached={onScrollToEnd}
                onEndReachedThreshold={1}
            />
            {false && hadiths.length > 0 ? (<ActivityIndicator animating={true} size="large" style={{marginBottom: 40}}/>) : null}
            <SectionsModal 
                visible={showSectionModal} 
                containerStyle={styles.modalContainer} 
                book="bukhari"
                onDismiss={onSectionsSelected} />
            <TagsModal 
                title="Maghanap galing sa Tags"
                visible={showTagsModal} 
                containerStyle={styles.modalContainer} 
                tags={knownTags}
                onDeleteTag={onDeleteTag}
                onAddTag={onNewTag}
                onDismiss={onTagsSelected} />
            <TagsModal 
                title="e-Tag ang hadith"
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