const axios = require('axios');
const fs = require('fs');

async function download() {
    const anton = await axios.get('https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf', { responseType: 'arraybuffer' });
    fs.writeFileSync('assets/Anton.ttf', anton.data);
    
    const montserrat = await axios.get('https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat-Bold.ttf', { responseType: 'arraybuffer' });
    fs.writeFileSync('assets/Montserrat.ttf', montserrat.data);
    console.log("Fonts downloaded successfully.");
}
download();
