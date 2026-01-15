const axios = require('axios');

const YT_KEY = process.env.YOUTUBE_API_KEY;
if (!YT_KEY) {
  console.warn('YOUTUBE_API_KEY not found in .env — youtube search will fail');
}

/**
 * searchYoutube
 * Query params: ?q=search+term&maxResults=5
 */
const searchYoutube = async (req, res) => {
  try {
    const q = req.query.q;
    const maxResults = Math.min(parseInt(req.query.maxResults || '5', 10), 20);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'q (query) param is required' });
    }

    const url = 'https://www.googleapis.com/youtube/v3/search';
    const params = {
      key: YT_KEY,
      part: 'snippet',
      q,
      type: 'video',
      maxResults
    };

    const response = await axios.get(url, { params });

    // Map to only necessary fields
    const items = response.data.items.map((it) => ({
      videoId: it.id.videoId,
      title: it.snippet.title,
      description: it.snippet.description,
      channelTitle: it.snippet.channelTitle,
      publishedAt: it.snippet.publishedAt,
      thumbnails: it.snippet.thumbnails
    }));

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('YouTube controller error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'YouTube search failed' });
  }
};

module.exports = { searchYoutube };
