#!/bin/sh

rm -vf ../node_modules/react-native-sqlite-storage/platforms/android-native/libs/sqlite-connector.jar

patch -N ../node_modules/react-native-sqlite-storage/platforms/android-native/build.gradle sqlite-storage.patch

cp -vf srclibs/Android-sqlite-connector/src/io/liteglue/* ../node_modules/react-native-sqlite-storage/platforms/android-native/src/main/java/io/liteglue/
