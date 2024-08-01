const RSSParser = require('rss-parser');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

// Function to fetch and filter articles based on source and category
const fetchBaseNewsURL = async (category, newsURL) => {
    const parser = new RSSParser();
    try {
      let items ={};
      let itemsList =[];
      let feedMetadata ={};
      let feedMetaDataList =[];
      if (!newsURL) throw new Error(`No URL configured for source ${newsURL}`);     
      // Fetch the RSS feed data
      const { data } = await axios.get(newsURL);
      
      // Use cheerio to load the RSS feed data
      const $ = cheerio.load(data, { xmlMode: true });
      const metadata = {
        title: $('channel > title').text(),
        link: $('channel > link').text(),       
        sourceImg :$('channel > image > url').text(),  
      };

      const feedItems = [];
    $('item').each((index, element) => {
      const title = $(element).find('title').text();
      const link = $(element).find('link').text();     
      const pubDate = $(element).find('pubDate').text();
      const creator = $(element).find('dc\\:creator').text(); // Handling the namespace with \\
      const itemImg = $(element).find('enclosure').attr('url') || $(element).find('enclosure').attr('xmlns:dc');
  
      // Extract and clean up the description
      let description = $(element).find('description').text();
      if (description) {
        const $desc = cheerio.load(description, { xmlMode: true });
        $desc('a').remove(); // Remove all <a> tags
        $desc('img').remove(); // Remove all <img> tags
        description = $desc.text(); // Get the cleaned HTML       
        
      }
      //console.log('itemImg',itemImg)
      feedItems.push({
        title,
        link,
        
        pubDate,
        creator,
        itemImg,
        description// Include the complete description with HTML
      });
    });
      return { metadata, feedItems };
    } catch (err) {
      console.error(`Error fetching or parsing feed for ${category}:`, err.message);
      throw err;
    }
  };

  module.exports = fetchBaseNewsURL;