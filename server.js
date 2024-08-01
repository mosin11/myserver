const express = require('express');
const RSSParser = require('rss-parser');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const fetchNewsArticles = require('./fetchNewsArticles');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON

const RSS_FEED_URLS = {
  'TheTimesofIndia': 'https://timesofindia.indiatimes.com/rss.cms',
  'TheHindu': 'https://www.thehindu.com/feeder/default.rss',
  'HindustanTimes': 'https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml',
  'TheIndianExpress': 'https://indianexpress.com/feed/'
};

// Function to fetch and filter articles based on source and category
const fetchBaseNewsURL = async (source, category) => {
  const parser = new RSSParser();
  try {
    
    const url = RSS_FEED_URLS[source];
    if (!url) throw new Error(`No URL configured for source ${source}`);
    console.log("Feed source URL:", url);

    // Fetch the RSS feed data
    const { data } = await axios.get(url);

    // Use cheerio to load the RSS feed data
    const $ = cheerio.load(data);
  
    const elementss = $('#main-copy p table tbody tr td:first-child a');
    const feedUrls = [];
    elementss.each((i, element) => {
      feedUrls.push({
        newsURL: $(element).attr('href'),
        categoryName: $(element).html() // Use .html() to get the inner HTML
      });
    });

    
    return feedUrls;
  } catch (err) {
    console.error(`Error fetching or parsing feed for ${source}:`, err.message);
    throw err;
  }
};
// Example endpoint for a specific source /rss/TheTimesofIndia
app.post('/rss/TheTimesofIndia', async (req, res) => {

  console.log("/rss/TheTimesofIndia Request Body:", req.body);
  console.log("/rss/TheTimesofIndia Request Body:", req.body.newsURL);
  const { category} = req.body;
  try {
    const allItems = await fetchBaseNewsURL('TheTimesofIndia', category, req.body.newsURL);
    res.json({
      totalArticles : allItems
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// Repeat the above endpoint for each specific source
app.post('/rss/TheHindu', async (req, res) => {

  console.log("/rss/TheHindu Request Body:", req.body.newsURL);
  const { category, page = 1, pageSize = 10 } = req.body;
  try {
    const allItems = await fetchBaseNewsURL('TheHindu', category, req.body.newsURL);

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);

    res.json({
      articles: paginatedItems,
      totalResults: allItems.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.post('/rss/HindustanTimes', async (req, res) => {

  console.log("/rss/HindustanTimes Request Body:", req.body);
  const { category, page = 1, pageSize = 10 } = req.body;
  try {
    const allItems = await fetchBaseNewsURL('HindustanTimes', category, req.body.newsURL);

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);

    res.json({
      articles: paginatedItems,
      totalResults: allItems.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.post('/rss/TheIndianExpress', async (req, res) => {

  console.log("/rss/TheIndianExpress Request Body:", req.body);
  const { category, page = 1, pageSize = 10 } = req.body;
  try {
    const allItems = await fetchBaseNewsURL('TheIndianExpress', category, req.body.newsURL);

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);

    res.json({
      articles: paginatedItems,
      totalResults: allItems.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});


// Generic endpoint for fetching articles
app.post('/rss/:source/:category', async (req, res) => {  

  const { source, category } = req.params;  // Access URL parameters from req.params
  const { newsURL } = req.body;  // Access body data

  try {
    console.log('req URL',newsURL)
    console.log('req source',source)
    const allItemsData = await fetchNewsArticles(category, req.body.newsURL);

    res.json({
      metadata: allItemsData.metadata,      
      totalArticles: allItemsData.feedItems
    });
    
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
