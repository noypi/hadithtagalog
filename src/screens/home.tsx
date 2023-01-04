import React from 'react';
import {StyleSheet, FlatList} from 'react-native';
import { Searchbar, Chip, List, Provider, Surface, Text } from 'react-native-paper';
import {hadithBooks, hadithSectionOf} from '@data';
import {openHadithsDb} from '@lib';

import {ScreenWrapper} from './screenwrapper';
import {HadithCard, SectionsModal} from './components';
import { SECTION_FIRST, SECTION_LAST } from '../data/sections';

let dbfil;
openHadithsDb('hadiths.tagalog').then(db => dbfil = db);

const BookChips = ({hadithBooks}) => (
    <List.Section>
        <Surface style={styles.row}>
            {hadithBooks.map((book, key) =>
                <Chip icon="book" 
                    onPress={() => console.log(book)}
                    style={styles.chip}
                    mode="outlined" 
                    key={key}>
                        {book}
                </Chip>)
            }
        </Surface>
    </List.Section>
)

export const HomeScreen = () => {
    const [searchResults, setSearchResults] = React.useState([]);
    const [hadiths, setHadiths] = React.useState([]);
    const [showSectionModal, setShowSectionModal] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchWords, setSearchWords] = React.useState([]);
    const onChangeSearch = query => {
        setSearchQuery(query)
        setSearchWords(query.split(" ").filter(word => word.length > 0));
        if (searchResults.lengh > 0) {
            setHadiths(searchResults.map(result => {
                for(let i=0; i<searchWords.length; i++) {
                    const word = searchWords[i];
                    let n = result.content.search(new RegExp(`${word}`, 'i'));
                    if (0 <= n) {
                        return true;
                    }
                }
                return false;
            }));
        }
    }

    const onSearch = async () => {
        let results: Array<any> = [];
        let matchId = searchWords.filter(w => Number.isInteger(parseInt(w))).join(" ");
        let matchContent = searchQuery;
        if (matchContent.length == 0) {
            if (matchId.length == 0) {
                matchId = 'bukhari';
            }
        }

        await dbfil?.search(matchContent, matchId, (item) => {
            results = [...results, item];
            if (results.length == 3) {
                setHadiths(results);
            } 
            console.debug("results.length=>", results.length);
        })
        setHadiths(results);
        setSearchResults(results);
        console.debug("then results.length=>", results.length);
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
        //console.debug("+-onSectionsSelected() =>", selected);
        setShowSectionModal(false);

        let results: Array<any> = [];
        for(let book in selected) {
            const sections: any = selected[book];
            for(let sectionId in sections) {
                let section = sections[sectionId];
                let first = section[SECTION_FIRST];
                let last = section[SECTION_LAST];
                await dbfil?.getRange(book, first, last-first+1, (item) => {
                    results = [...results, item];
                    if (results.length == 2) {
                        setHadiths(results);
                    } 
                    //console.debug("results.length=>", results.length);
                })
            }
        }
        //console.log(Object.keys(results), "done");
        setHadiths(results);
        setSearchResults(results);
    }

    return (
        <ScreenWrapper>
            <Searchbar
                placeholder="Search"
                onChangeText={onChangeSearch}
                onIconPress={onSearch}
                onSubmitEditing={onSubmitEditing}
                value={searchQuery}
            />
            <Surface style={{flexDirection: 'row', alignItems: 'center', marginRight:5, marginLeft:10}} elevation="1">
                    <Chip icon="format-list-checks" 
                        style={{flex:4}}
                        onPress={() => { 
                            console.debug({showSectionModal});
                            setShowSectionModal(true)
                        }}>Mga Kategorya</Chip>
                    <Text style={{flex: 4}}></Text>
                    <Text style={{flex: 2}}>Found: {hadiths.length}</Text>
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