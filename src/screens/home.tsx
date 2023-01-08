import React from 'react';
import {StyleSheet, FlatList, View} from 'react-native';
import { Searchbar, ActivityIndicator, Surface, Text, Checkbox, IconButton, Title } from 'react-native-paper';
import {hadithBooks, hadithSectionOf} from '@data';
import {openHadithsDb, QUERY_STEP} from '@lib';

import {ScreenWrapper} from './screenwrapper';
import {HadithCard, SectionsModal} from './components';
import { SECTION_FIRST, SECTION_LAST } from '../data/sections';

let dbfil;
openHadithsDb('hadiths.db').then(db => dbfil = db);

export const HomeScreen = () => {
    const {colors} = useAppTheme();
    const styles = makeStyles(colors);
    const [hadiths, setHadiths] = React.useState([]);
    const [favoritesLocal, setFavoritesLocal] = React.useState({});
    const [showSectionModal, setShowSectionModal] = React.useState(false);
    const [useSelectedOnSearch, setUseSelectedOnSearch] = React.useState(false);
    const [useFavoritesOnSearch, setUseFavoritesOnSearch] = React.useState(false);
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
            setUseFavoritesOnSearch(false);
            setShowSectionModal(true);
        }
    }

    const onPressFavorites = async () => {
        if (!useFavoritesOnSearch) {
            let rg = await dbfil.getFavorites();
            setResultGen(rg);
            let y = await rg.next();
            setIsResultGenDone(y.done);
            //console.debug({favorites: y.value});
            setHadithsSafe(y.value);
            setFavoritesLocal({});
            setUseSelectedOnSearch(false);
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
                        <View style={{flexDirection: 'row', flex: 2, alignItems: 'center'}}>
                            <Checkbox
                                status={useSelectedOnSearch ? 'checked' : 'unchecked'}
                                onPress={onPressCategories}
                            />
                            <Text>Kategorya</Text>
                        </View>
                        <View style={{flexDirection: 'row', flex: 2, alignItems: 'center'}}>
                            <Checkbox
                                status={useFavoritesOnSearch ? 'checked' : 'unchecked'}
                                onPress={onPressFavorites}
                            />
                            <Text>Paborito</Text>
                        </View>
                        <Text style={{flex: 1}}>Nakita: {hadiths.length}</Text>
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