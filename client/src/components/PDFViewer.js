import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';

const PDFViewer = ({ route }) => {
    const { url } = route.params;

    return (
        <Pdf
            source={{ uri: url }}
            style={styles.pdf}
            onLoadComplete={(numberOfPages, filePath) => {
                console.log(`Number of pages: ${numberOfPages}`);
            }}
            onPageChanged={(page, numberOfPages) => {
                console.log(`Current page: ${page}`);
            }}
            onError={(error) => {
                console.log(error);
            }}
        />
    );
};

const styles = StyleSheet.create({
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});

export default PDFViewer; 