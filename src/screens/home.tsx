import React from 'react';
import {StyleSheet, FlatList, View} from 'react-native';
import { Searchbar, ActivityIndicator, Surface, Text, Checkbox, IconButton } from 'react-native-paper';
import {hadithBooks, hadithSectionOf} from '@data';
import {openHadithsDb} from '@lib';

import {ScreenWrapper} from './screenwrapper';
import {HadithCard, SectionsModal} from './components';
import { SECTION_FIRST, SECTION_LAST } from '../data/sections';

let dbfil;
openHadithsDb('hadiths.db').then(db => dbfil = db);

export const HomeScreen = () => {
    const [hadiths, setHadiths] = React.useState([]);
    const [showSectionModal, setShowSectionModal] = React.useState(false);
    const [useSelectedOnSearch, setUseSelectedOnSearch] = React.useState(false);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCategories, setSelectedCategories] = React.useState({});
    const [searchWords, setSearchWords] = React.useState([]);
    const onChangeSearch = query => {
        //console.debug("+- onChangeSearch() =>", {query});
        setSearchQuery(query)
        setSearchWords(query.split(" ").filter(word => word.length > 0));
    }

    const onSearch = async () => {
        setIsSearching(true);
        let results: Array<any> = [];
        let matchIds = searchWords.filter(w => Number.isInteger(parseInt(w)));
        let matchContent = searchQuery;

        // match 
        //  - integer ids on search bar
        //  - hadith content
        //  - selected categories on search
        await dbfil?.search({matchContent, matchIds, selected: useSelectedOnSearch ? selectedCategories : null}, (item) => {
            results = [...results, item];
            if (results.length == 10) {
                setHadiths(results);
            } 
            //console.debug("results.length=>", results.length);
        }, _ => {
            setHadiths(results);
            setIsSearching(false);
        });
    }

    const onSubmitEditing = async ({nativeEvent: {text}}) => {
        onSearch();
    };

    const renderHadithCard = (item) => {
        item = item.item;
        if (!item || !item.content) {
            return null;
        }
        const text = item.content;
        const atColon = text.indexOf(":");
        const cardTitle = (atColon>0) ? text.slice(0, atColon) : "";
        const content = text.slice(text.indexOf(":")+1); // if atColon is -1 => then .slice(0) => original text
        const highlights = searchWords;
        const props = {
            highlights, 
            cardTitle, 
            title: hadithSectionOf(item.id).title, 
            content,
            subtitle: item.id
        }
        return (<HadithCard {...props}/>);
    }

    const onSectionsSelected = async (selected) => {
        console.debug("+-onSectionsSelected() =>", selected);
        setShowSectionModal(false);
        setSelectedCategories(selected);

        if (Object.keys(selected).length == 0) { return };

        setIsSearching(true);
        let rangesCount: number = 0;
        let results: Array<any> = [];
        await dbfil?.getSelectedRanges(selected, (item) => {
            rangesCount++;
            results = [...results, item];
            if (results.length == 10) {
                setHadiths(results);
            } 
            //console.debug("results.length=>", results.length);
        }, _ => {
            setHadiths(results);
            setIsSearching(false);
        });
        if(rangesCount > 0) {
            setUseSelectedOnSearch(true);
        }
        
    }

    return (
        <ScreenWrapper>
            <Surface elevation="2">
                <Searchbar
                    placeholder="Search"
                    onChangeText={onChangeSearch}
                    onIconPress={onSearch}
                    onSubmitEditing={onSubmitEditing}
                    value={searchQuery}
                />
                <Surface style={{flexDirection: 'row', alignItems: 'center', marginRight:5, marginLeft:10}}>
                        <View style={{flexDirection: 'row', flex: 2, alignItems: 'center'}}>
                            <Checkbox
                                status={useSelectedOnSearch ? 'checked' : 'unchecked'}
                                onPress={() => {
                                    if (useSelectedOnSearch) {
                                        setUseSelectedOnSearch(false);
                                    } else {
                                        setShowSectionModal(true);
                                    }
                                }}
                            />
                            <Text>Kategorya</Text>
                        </View>
                        <View style={{flexDirection: 'row', flex: 2, alignItems: 'center'}}>
                            <Checkbox
                                status={useSelectedOnSearch ? 'checked' : 'unchecked'}
                                onPress={() => {
                                    if (useSelectedOnSearch) {
                                        setUseSelectedOnSearch(false);
                                    } else {
                                        setShowSectionModal(true);
                                    }
                                }}
                            />
                            <Text>Paborito</Text>
                        </View>
                        <Text style={{flex: 1}}>Nakita: {hadiths.length}</Text>
                </Surface>
                {isSearching ? <ActivityIndicator animating={isSearching} size="large" /> : null}
            </Surface>
            <FlatList
                data={hadiths}
                keyExtractor={(item, i) => i}
                renderItem={renderHadithCard}
            />
            <SectionsModal 
                visible={showSectionModal} 
                containerStyle={styles.modalContainer} 
                book="bukhari"
                onDismiss={onSectionsSelected} />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
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

});